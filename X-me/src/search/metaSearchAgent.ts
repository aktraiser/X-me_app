import { ChatOpenAI } from '@langchain/openai';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { Embeddings } from '@langchain/core/embeddings';
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
  PromptTemplate,
} from '@langchain/core/prompts';
import {
  RunnableLambda,
  RunnableMap,
  RunnableSequence,
} from '@langchain/core/runnables';
import {
  BaseMessage,
  AIMessage,
  HumanMessage,
} from '@langchain/core/messages';
import { StringOutputParser } from '@langchain/core/output_parsers';
import LineListOutputParser from '../lib/outputParsers/listLineOutputParser';
import LineOutputParser from '../lib/outputParsers/lineOutputParser';
import { Document } from 'langchain/document';
import { searchSearxng } from '../lib/searxng';
import path from 'path';
import fs from 'fs';
import { EventEmitter } from 'events';
import { StreamEvent } from '@langchain/core/tracers/log_stream';
import { IterableReadableStream } from '@langchain/core/utils/stream';
import handleImageSearch from '../chains/imageSearchAgent';
import handleExpertSearch from '../chains/expertSearchAgent';
import { RAGDocumentChain } from '../chains/rag_document_upload';
import { webSearchRetrieverPrompt, webSearchResponsePrompt } from '../prompts/webSearch';

export interface MetaSearchAgentType {
  searchAndAnswer: (
    message: string,
    history: BaseMessage[],
    llm: BaseChatModel,
    embeddings: Embeddings,
    optimizationMode: 'speed' | 'balanced' | 'quality',
    fileIds: string[],
  ) => Promise<EventEmitter>;
}

interface Config {
  activeEngines: string[];
  queryGeneratorPrompt?: string;
  responsePrompt?: string;
  rerank: boolean;
  rerankThreshold: number;
  searchWeb: boolean;
  summarizer: boolean;
  searchDatabase: boolean;
  provider?: string;
  model?: string;
  customOpenAIBaseURL?: string;
  customOpenAIKey?: string;
}

type BasicChainInput = {
  chat_history: BaseMessage[];
  query: string;
};

interface SearchResponse {
  text: string;
  sources: Array<{
    title: string;
    content: string;
    url?: string;
    source?: string;
  }>;
  illustrationImage?: string;
}

interface DocumentMetadata {
  title?: string;
  source?: string;
  fileId?: string;
  url?: string;
}

interface SearchResult {
  pageContent: string;
  metadata: {
    score?: number;
    title?: string;
    [key: string]: any;
  };
}

export class MetaSearchAgent implements MetaSearchAgentType {
  private config: Config;
  private strParser = new StringOutputParser();
  // Mise en cache des contenus des fichiers afin de limiter les accès disque répétitifs
  private fileCache = new Map<string, { content: any; embeddingsData: any }>();
  private conversationHistory: BaseMessage[] = [];

  constructor(config: Config) {
    this.config = config;
  }

  private updateMemory(message: BaseMessage) {
    this.conversationHistory.push(message);
  }

  public getMemory(): BaseMessage[] {
    return this.conversationHistory;
  }

  /**
   * Chaîne de récupération des liens à partir d'une requête de recherche web.
   */
  private async createSearchRetrieverChain(llm: BaseChatModel) {
    // Forcer la température à 0 pour obtenir une réponse déterministe
    (llm as unknown as ChatOpenAI).temperature = 0;
    return RunnableSequence.from([
      PromptTemplate.fromTemplate(webSearchRetrieverPrompt),
      llm,
      this.strParser,
      RunnableLambda.from(async (input: string) => {
        const linksOutputParser = new LineListOutputParser({ key: 'links' });
        const questionOutputParser = new LineOutputParser({ key: 'question' });

        const links = await linksOutputParser.parse(input);
        let question = this.config.summarizer
          ? await questionOutputParser.parse(input)
          : input;

        if (question === 'not_needed') {
          return { query: '', docs: [] };
        }

        let documents: Document[] = [];
        if (this.config.searchWeb) {
          console.log('🔍 Démarrage de la recherche web...');
          const res = await searchSearxng(question, {
            language: 'fr',
            engines: this.config.activeEngines,
          });

          documents = res.results.map(result =>
            new Document({
              pageContent: result.content,
              metadata: {
                title: result.title,
                url: result.url,
                type: 'web',
                source: 'web',
                displayDomain: new URL(result.url).hostname.replace('www.', ''),
                favicon: `https://s2.googleusercontent.com/s2/favicons?domain_url=${result.url}`,
                linkText: 'Voir la page',
                ...(result.img_src && { img_src: result.img_src }),
              },
            }),
          );
          console.log('🌐 Sources web trouvées:', documents.length);
        }
        return { query: question, docs: documents };
      }),
    ]);
  }

  /**
   * Chargement des documents uploadés avec mise en cache pour limiter les accès disque.
   */
  private async loadUploadedDocuments(fileIds: string[]): Promise<Document[]> {
    console.log('📂 Chargement des documents:', fileIds);
    const docsArrays = await Promise.all(
      fileIds.map(async (fileId) => {
        try {
          // Si déjà en cache, on utilise les données mises en cache
          if (this.fileCache.has(fileId)) {
            return this.processFileContent(fileId, this.fileCache.get(fileId)!);
          }
          const filePath = path.join(process.cwd(), 'uploads', fileId);
          const contentPath = `${filePath}-extracted.json`;
          const embeddingsPath = `${filePath}-embeddings.json`;

          await fs.promises.access(contentPath);
          const contentData = await fs.promises.readFile(contentPath, 'utf8');
          const content = JSON.parse(contentData);

          let embeddingsData = null;
          try {
            await fs.promises.access(embeddingsPath);
            const embeddingsContent = await fs.promises.readFile(embeddingsPath, 'utf8');
            embeddingsData = JSON.parse(embeddingsContent);
          } catch (err) {
            // Aucun embedding pré-calculé
          }

          const fileData = { content, embeddingsData };
          this.fileCache.set(fileId, fileData);
          return this.processFileContent(fileId, fileData);
        } catch (error) {
          console.error(`❌ Erreur lors du chargement du fichier ${fileId}:`, error);
          return [];
        }
      })
    );

    return docsArrays.flat();
  }

  /**
   * Transformation du contenu d'un fichier en tableaux de Document.
   */
  private processFileContent(fileId: string, fileData: { content: any; embeddingsData: any }): Document[] {
    const { content, embeddingsData } = fileData;
    if (!content.contents || !Array.isArray(content.contents)) {
      throw new Error(`Structure de contenu invalide pour ${fileId}`);
    }
    const chunksPerPage = Math.ceil(content.contents.length / (content.pageCount || 10));
    return content.contents.map((chunk: any, index: number) => {
      const pageNumber = Math.floor(index / chunksPerPage) + 1;
      return new Document({
        pageContent: typeof chunk === 'string' ? chunk : chunk.content,
        metadata: {
          ...(typeof chunk === 'object' ? chunk.metadata : {}),
          source: fileId,
          title: content.title || 'Document sans titre',
          pageNumber,
          chunkIndex: index,
          totalChunks: content.contents.length,
          type: 'uploaded',
          embedding: embeddingsData?.embeddings?.[index]?.vector,
          searchText: (typeof chunk === 'string' ? chunk : chunk.content)
            .substring(0, 100)
            .replace(/[\n\r]+/g, ' ')
            .trim(),
        },
      });
    });
  }

  /**
   * Chaîne permettant de générer la réponse finale à partir des documents et du contexte.
   */
  private async createAnsweringChain(
    llm: BaseChatModel,
    fileIds: string[],
    embeddings: Embeddings,
    optimizationMode: 'speed' | 'balanced' | 'quality',
  ) {
    return RunnableSequence.from([
      RunnableMap.from({
        query: (input: BasicChainInput) => input.query,
        chat_history: (input: BasicChainInput) => input.chat_history,
        docs: RunnableLambda.from(async (input: BasicChainInput) => {
          console.log('Début de la recherche...');
          let docs: Document[] = [];

          // 1. Recherche dans les documents uploadés
          if (fileIds.length > 0) {
            try {
              const uploadedDocs = await this.loadUploadedDocuments(fileIds);
              console.log('📚 Documents uploadés chargés:', uploadedDocs.length);

              const ragChain = RAGDocumentChain.getInstance();
              await ragChain.initializeVectorStoreFromDocuments(uploadedDocs, embeddings);

              const searchChain = ragChain.createSearchChain(llm);
              const relevantDocs = await searchChain.invoke({
                query: input.query,
                chat_history: input.chat_history,
                type: 'specific'
              });

              // On affecte un score élevé aux documents uploadés
              docs = uploadedDocs.map(doc => ({
                ...doc,
                metadata: { ...doc.metadata, score: 0.8 }
              }));

              console.log('📄 Documents pertinents trouvés:', docs.length);
            } catch (error) {
              console.error('❌ Erreur lors de la recherche dans les documents:', error);
            }
          }

          // 2. Recherche d’experts (si activée)
          if (this.config.searchDatabase) {
            try {
              console.log('👥 Recherche d\'experts...');
              const expertResults = await this.searchExperts(input.query, embeddings, llm);
              if (expertResults.length > 0) {
                docs = [...docs, ...expertResults];
              }
            } catch (error) {
              console.error('❌ Erreur lors de la recherche d\'experts:', error);
            }
          }

          // 3. Recherche web
          if (this.config.searchWeb) {
            try {
              console.log('🌐 Démarrage de la recherche web...');
              const webResults = await this.performWebSearch(input.query);
              console.log(`🌐 ${webResults.length} résultats web trouvés`);
              docs = [...docs, ...webResults];
            } catch (error) {
              console.error('❌ Erreur lors de la recherche web:', error);
            }
          }

          console.log('🔍 DEBUG - Avant appel rerankDocs - Mode:', optimizationMode, 'Query:', input.query);
          return this.rerankDocs(
            input.query,
            docs,
            fileIds,
            embeddings,
            optimizationMode,
            llm
          );
        }).withConfig({ runName: 'FinalSourceRetriever' }),
      }),
      RunnableMap.from({
        query: (input) => input.query,
        chat_history: (input) => input.chat_history,
        date: () => new Date().toISOString(),
        context: (input) => {
          console.log('Préparation du contexte...');
          return this.processDocs(input.docs);
        },
        docs: (input) => input.docs,
      }),
      ChatPromptTemplate.fromMessages([
        ['system', webSearchResponsePrompt],
        new MessagesPlaceholder('chat_history'),
        ['user', '{context}\n\n{query}'],
      ]),
      llm,
      this.strParser,
    ]).withConfig({ runName: 'FinalResponseGenerator' });
  }

  /**
   * Conversion des experts en Documents.
   */
  private convertExpertsToDocuments(experts: any[]): Document[] {
    return experts.map(expert =>
      new Document({
        pageContent: `Expert: ${expert.prenom} ${expert.nom}
Spécialité: ${expert.specialite}
Ville: ${expert.ville}
Tarif: ${expert.tarif}€
Expertises: ${expert.expertises}
Services: ${JSON.stringify(expert.services)}
${expert.biographie}`,
        metadata: {
          type: 'expert',
          expert: true,
          expertData: expert,
          title: `${expert.specialite} - ${expert.ville}`,
          url: `/expert/${expert.id_expert}`,
          image_url: expert.image_url
        }
      })
    );
  }

  /**
   * Recherche web à partir de la query.
   */
  private async performWebSearch(query: string): Promise<Document[]> {
    const res = await searchSearxng(query, {
      language: 'fr',
      engines: this.config.activeEngines,
    });
    return res.results.map(result =>
      new Document({
        pageContent: result.content,
        metadata: {
          title: result.title,
          url: result.url,
          type: 'web',
          ...(result.img_src && { img_src: result.img_src }),
        },
      })
    );
  }

  /**
   * Traitement et formatage des documents pour le contexte final.
   */
  private processDocs(docs: Document[]): string {
    console.log(`🔍 Traitement de ${docs.length} documents...`);
    if (docs.length === 0) {
      console.log('⚠️ Aucun document à traiter');
      return "Aucun document pertinent trouvé.";
    }
    const sortedDocs = docs.sort((a, b) => {
      if (a.metadata?.type === 'sector' && b.metadata?.type !== 'sector') return -1;
      if (a.metadata?.type !== 'sector' && b.metadata?.type === 'sector') return 1;
      return (b.metadata?.score || 0) - (a.metadata?.score || 0);
    });
    const limitedDocs = sortedDocs.slice(0, 10);
    const processedDocs = limitedDocs.map((doc, index) => {
      const source = this.formatSource(doc);
      const keyInfo = this.extractKeyInfo(doc.pageContent);
      const content = this.formatContent(doc.pageContent);
      return `=== Source ${index + 1}: ${source} ===\n${keyInfo}\n${content}\n`;
    }).join('\n\n');
    console.log(`✅ ${limitedDocs.length} documents traités et formatés`);
    return processedDocs;
  }

  /**
   * Formatage de la source d'un document.
   */
  private formatSource(doc: Document): string {
    const type = doc.metadata?.type || 'unknown';
    const title = doc.metadata?.title || 'Sans titre';
    const source = doc.metadata?.source || '';
    const subsector = doc.metadata?.subsector || '';
    switch (type) {
      case 'sector':
        return `[Document Sectoriel: ${title}${subsector ? ` - ${subsector}` : ''}]`;
      case 'web':
        return `[Source Web: ${title}]`;
      default:
        return `[${title}${source ? ` - ${source}` : ''}]`;
    }
  }

  /**
   * Extraction d’informations clés dans le contenu.
   */
  private extractKeyInfo(content: string): string {
    const keyPatterns = [
      /\d+(?:,\d+)?(?:\s*%|\s*euros?|\s*€)/g,
      /\d{4}/g,
      /\d+(?:,\d+)?\s*(?:millions?|milliards?)/g
    ];
    const keyInfo = keyPatterns
      .map(pattern => {
        const matches = content.match(pattern);
        return matches ? matches.slice(0, 5) : [];
      })
      .flat()
      .filter((v, i, a) => a.indexOf(v) === i)
      .join(', ');
    return keyInfo ? `Informations clés: ${keyInfo}` : '';
  }

  /**
   * Formatage du contenu avec limitation de la taille et nettoyage.
   */
  private formatContent(content: string): string {
    const maxLength = 1500;
    const truncated = content.length > maxLength 
      ? content.substring(0, maxLength) + '...'
      : content;
    return truncated
      .replace(/\n{3,}/g, '\n\n')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  /**
   * Fonction utilitaire de normalisation d'une source.
   */
  private normalizeSource(source: any): any {
    const isUploadedDoc = source.metadata?.type === 'uploaded';
    const isExpert = source.metadata?.type === 'expert';
    const isWeb = source.metadata?.type === 'web';
    const sourceId = source.metadata?.source;
    const pageNumber = source.metadata?.pageNumber || source.metadata?.page || 1;
    let url;
    if (isUploadedDoc && sourceId) {
      url = `/api/uploads/${sourceId}/content?page=${pageNumber}`;
    } else if (isExpert) {
      url = source.metadata?.expertData?.url || source.metadata?.url;
    } else if (isWeb) {
      url = source.metadata?.url;
    }
    let title = source.metadata?.title || '';
    if (isUploadedDoc && title) {
      title = `${title} - Page ${pageNumber}`;
    } else if (isExpert) {
      title = source.metadata?.displayTitle || title;
    }
    const limitedContent = source.pageContent?.substring(0, 1000) || '';
    return {
      pageContent: limitedContent,
      metadata: {
        title,
        type: source.metadata?.type || 'web',
        url,
        source: sourceId || (isWeb ? 'web' : undefined),
        pageNumber,
        displayDomain: isUploadedDoc
          ? 'Document local'
          : (isWeb && url ? new URL(url).hostname.replace('www.', '') : undefined),
        searchText:
          source.metadata?.searchText?.substring(0, 200) ||
          limitedContent.substring(0, 200),
        expertData: source.metadata?.expertData,
        illustrationImage: source.metadata?.illustrationImage,
        imageTitle: source.metadata?.imageTitle,
        favicon: isWeb ? `https://s2.googleusercontent.com/s2/favicons?domain_url=${url}` : source.metadata?.favicon,
        linkText: isWeb ? 'Voir la page' : 'Voir la source',
        expertName: source.metadata?.expertName,
        fileId: sourceId,
        page: pageNumber,
        isFile: isUploadedDoc,
      }
    };
  }

  /**
   * Gestion du stream d’événements pour la génération des réponses et des sources.
   */
  private async handleStream(
    stream: IterableReadableStream<StreamEvent>,
    emitter: EventEmitter
  ) {
    for await (const event of stream) {
      if (
        event.event === 'on_chain_end' &&
        event.name === 'FinalSourceRetriever'
      ) {
        const sources = event.data.output;
        const normalizedSources = sources?.map(this.normalizeSource) || [];
        emitter.emit(
          'data',
          JSON.stringify({
            type: 'sources',
            data: normalizedSources,
            illustrationImage: normalizedSources[0]?.metadata?.illustrationImage || null,
            imageTitle: normalizedSources[0]?.metadata?.imageTitle || null
          })
        );
      }
      if (
        event.event === 'on_chain_stream' &&
        event.name === 'FinalResponseGenerator'
      ) {
        emitter.emit(
          'data',
          JSON.stringify({ type: 'response', data: event.data.chunk })
        );
      }
      if (
        event.event === 'on_chain_end' &&
        event.name === 'FinalResponseGenerator'
      ) {
        emitter.emit('end');
      }
    }
  }

  /**
   * Gestion du stream en mémorisant la réponse complète et en émettant des suggestions.
   */
  private async handleStreamWithMemory(
    stream: IterableReadableStream<StreamEvent>,
    emitter: EventEmitter,
    llm: BaseChatModel,
    originalQuery: string
  ) {
    let fullAssistantResponse = '';
    let hasEmittedSuggestions = false;
    for await (const event of stream) {
      if (event.event === 'on_chain_stream' && event.name === 'FinalResponseGenerator') {
        fullAssistantResponse += event.data.chunk;
        emitter.emit(
          'data',
          JSON.stringify({ type: 'response', data: event.data.chunk })
        );
      } else if (event.event === 'on_chain_end') {
        if (event.name === 'FinalResponseGenerator' && !hasEmittedSuggestions) {
          try {
            const suggestionsPrompt = `
Based on this conversation and response, suggest 3 relevant follow-up questions:
"${fullAssistantResponse}"
Return only the questions, one per line.`;
            const suggestionsResponse = await llm.invoke(suggestionsPrompt);
            const suggestions = String(suggestionsResponse.content)
              .split('\n')
              .filter(s => s.trim())
              .slice(0, 3);
            emitter.emit(
              'data',
              JSON.stringify({
                type: 'suggestions',
                data: {
                  suggestions,
                  suggestedExperts: []
                }
              })
            );
            hasEmittedSuggestions = true;
          } catch (error) {
            console.error('❌ Erreur lors de la génération des suggestions:', error);
          }
          this.updateMemory(new AIMessage(fullAssistantResponse.trim()));
          emitter.emit('end');
        }
        if (event.name === 'FinalSourceRetriever') {
          const sources = event.data.output;
          const normalizedSources = sources?.map(this.normalizeSource) || [];
          emitter.emit(
            'data',
            JSON.stringify({
              type: 'sources',
              data: normalizedSources,
              illustrationImage: normalizedSources[0]?.metadata?.illustrationImage || null,
              imageTitle: normalizedSources[0]?.metadata?.imageTitle || null
            })
          );
        }
      } else {
        emitter.emit(event.event, event.data);
      }
    }
  }

  /**
   * Recherche d’experts.
   */
  private async searchExperts(
    query: string,
    embeddings: Embeddings,
    llm: BaseChatModel
  ): Promise<SearchResult[]> {
    try {
      console.log('👥 Recherche d\'experts pour:', query);
      const cleanQuery = query.replace(/[%']/g, ' ').trim();
      const expertResults = await handleExpertSearch(
        {
          query: cleanQuery,
          chat_history: [],
          messageId: 'search_' + Date.now(),
          chatId: 'chat_' + Date.now()
        },
        llm
      );
      return expertResults.experts.map(expert => ({
        pageContent: `Expert: ${expert.prenom} ${expert.nom}
Spécialité: ${expert.specialite}
Ville: ${expert.ville}
Tarif: ${expert.tarif}€
Expertises: ${expert.expertises}
Services: ${JSON.stringify(expert.services)}
${expert.biographie}`,
        metadata: {
          type: 'expert',
          expert: true,
          expertData: expert,
          title: `${expert.prenom} ${expert.nom} - ${expert.specialite}`,
          url: expert.url,
          image_url: expert.image_url,
          score: 0.6
        }
      }));
    } catch (error) {
      console.error('❌ Erreur lors de la recherche d\'experts:', error);
      return [];
    }
  }

  /**
   * Recherche d’images.
   */
  private async handleImageSearch(query: string, llm: BaseChatModel) {
    try {
      const results = await handleImageSearch({ query, chat_history: [] }, llm);
      if (!results || !Array.isArray(results)) {
        console.warn('⚠️ Résultat de recherche d\'images invalide');
        return [];
      }
      return results;
    } catch (error) {
      console.error('❌ Erreur lors de la recherche d\'images:', error);
      return [];
    }
  }

  /**
   * Recherche web alternative.
   */
  private async searchWeb(query: string): Promise<SearchResult[]> {
    try {
      console.log('🌐 Recherche web pour:', query);
      const res = await searchSearxng(query, {
        language: 'fr',
        engines: this.config.activeEngines,
      });
      return res.results.map(result => ({
        pageContent: result.content,
        metadata: {
          title: result.title,
          url: result.url,
          type: 'web',
          score: 0.4,
          ...(result.img_src && { img_src: result.img_src }),
        }
      }));
    } catch (error) {
      console.error('❌ Erreur lors de la recherche web:', error);
      return [];
    }
  }

  /**
   * Exécution parallèle des recherches (images, experts, web) avec Promise.allSettled.
   */
  private async parallelSearchOperations(
    query: string,
    llm: BaseChatModel,
    embeddings: Embeddings,
    optimizationMode: 'speed' | 'balanced' | 'quality'
  ): Promise<{
    images: any[];
    experts: SearchResult[];
    webResults: SearchResult[];
  }> {
    console.log('🔄 Démarrage des recherches parallèles');
    const searchTasks = {
      images: (optimizationMode === 'balanced' || optimizationMode === 'quality')
        ? this.handleImageSearch(query, llm)
        : Promise.resolve([]),
      experts: this.config.searchDatabase
        ? this.searchExperts(query, embeddings, llm)
        : Promise.resolve([]),
      webResults: this.config.searchWeb
        ? this.searchWeb(query)
        : Promise.resolve([])
    };
    const results = await Promise.allSettled([
      searchTasks.images,
      searchTasks.experts,
      searchTasks.webResults
    ]);
    const images = results[0].status === 'fulfilled' ? results[0].value : [];
    const experts = results[1].status === 'fulfilled' ? results[1].value : [];
    const webResults = results[2].status === 'fulfilled' ? results[2].value : [];
    console.log('✅ Recherches parallèles terminées', {
      images: images?.length,
      experts: experts.length,
      webResults: webResults.length
    });
    return { images, experts, webResults };
  }

  /**
   * Réaffectation des scores et enrichissement des documents avec les résultats parallèles.
   */
  private async rerankDocs(
    query: string,
    docs: Document[],
    fileIds: string[],
    embeddings: Embeddings,
    optimizationMode: 'speed' | 'balanced' | 'quality',
    llm: BaseChatModel
  ) {
    console.log('🔍 Mode d\'optimisation:', optimizationMode);
    console.log('🔍 Query pour la recherche d\'image:', query);

    const { images, experts, webResults } = await this.parallelSearchOperations(
      query,
      llm,
      embeddings,
      optimizationMode
    );

    let enrichedDocs = docs;
    if (images && images.length > 0) {
      console.log('🔍 Première image trouvée:', {
        src: images[0].img_src,
        title: images[0].title,
        url: images[0].url
      });
      enrichedDocs = docs.map(doc => ({
        ...doc,
        metadata: {
          ...doc.metadata,
          illustrationImage: images[0].img_src,
          imageTitle: images[0].title
        }
      }));
    }
    return [
      ...enrichedDocs,
      ...experts,
      ...webResults
    ].slice(0, 15);
  }

  /**
   * Traitement parallèle des documents (initialisation du vectorStore et recherche de documents similaires).
   */
  private async parallelDocumentProcessing(
    docs: Document[],
    embeddings: Embeddings,
    ragChain: RAGDocumentChain,
    message: string
  ): Promise<{
    vectorStore: any;
    relevantDocs: Document[];
  }> {
    console.log('📚 Démarrage traitement parallèle des documents');
    const initPromise = !ragChain.isInitialized()
      ? ragChain.initializeVectorStoreFromDocuments(docs, embeddings)
      : Promise.resolve(null);
    const [vectorStoreInit, relevantDocsSearch] = await Promise.all([
      initPromise,
      ragChain.searchSimilarDocuments(message, 5)
    ]);
    console.log('✅ Traitement parallèle des documents terminé');
    return { vectorStore: vectorStoreInit, relevantDocs: relevantDocsSearch };
  }

  /**
   * Méthode principale qui gère la recherche et la génération de réponse.
   */
  async searchAndAnswer(
    message: string,
    history: BaseMessage[],
    llm: BaseChatModel,
    embeddings: Embeddings,
    optimizationMode: 'speed' | 'balanced' | 'quality',
    fileIds: string[]
  ) {
    // Pour ce traitement, on fixe le mode effectif (par exemple "balanced")
    const effectiveMode: 'speed' | 'balanced' | 'quality' = 'balanced';
    const emitter = new EventEmitter();

    try {
      this.updateMemory(new HumanMessage(message));
      const mergedHistory: BaseMessage[] = [
        ...this.conversationHistory,
        ...history,
      ];

      console.log('🔄 Démarrage des opérations parallèles initiales');
      const [analysis, uploadedDocs] = await Promise.all([
        llm.invoke(`En tant qu'expert en analyse de requêtes, analysez la requête suivante : "${message}"`)
          .catch(error => ({
            content: JSON.stringify({
              primaryIntent: "HYBRID",
              requiresDocumentSearch: fileIds.length > 0,
              requiresWebSearch: true,
              requiresExpertSearch: true,
              documentRelevance: 0.8,
              reasoning: "Analyse par défaut suite à une erreur"
            })
          })),
        this.loadUploadedDocuments(fileIds)
      ]);

      console.log('📚 Documents uploadés chargés:', uploadedDocs.length);
      if (uploadedDocs.length > 0) {
        try {
          const parsedAnalysis = typeof analysis.content === 'string'
            ? JSON.parse(analysis.content)
            : analysis;
          console.log('🎯 Analyse de la requête:', parsedAnalysis);

          let messageData: any = null;
          if (message.trim().startsWith('{') && message.trim().endsWith('}')) {
            try {
              messageData = JSON.parse(message);
              console.log('✅ Message JSON détecté et parsé:', messageData);
            } catch (error) {
              console.log('📝 Message traité comme texte simple (parsing JSON échoué)');
            }
          }

          const ragChain = RAGDocumentChain.getInstance();
          const { vectorStore, relevantDocs } = await this.parallelDocumentProcessing(
            uploadedDocs,
            embeddings,
            ragChain,
            messageData?.query || message
          );

          console.log('📄 Documents pertinents trouvés:', relevantDocs.length);
          const documentContext = relevantDocs.map(doc => doc.pageContent).join('\n').substring(0, 500);
          const documentTitle = uploadedDocs[0]?.metadata?.title || '';
          const enrichedQuery = messageData?.query || `${message} ${documentTitle} ${documentContext}`;

          const searchResults = await this.parallelSearchOperations(
            enrichedQuery,
            llm,
            embeddings,
            effectiveMode
          );
          const combinedResults = [
            ...relevantDocs.map(doc => ({
              ...doc,
              metadata: { ...doc.metadata, type: doc.metadata.type || 'uploaded' }
            })),
            ...searchResults.webResults
          ];
          console.log('🔄 Résultats combinés:', {
            total: combinedResults.length,
            uploaded: relevantDocs.length,
            web: searchResults.webResults.length,
            types: combinedResults.map(doc => doc.metadata.type)
          });

          const finalResults = await this.rerankDocs(
            message,
            combinedResults,
            fileIds,
            embeddings,
            effectiveMode,
            llm
          );

          const answeringChain = await this.createAnsweringChain(
            llm,
            fileIds,
            embeddings,
            effectiveMode
          );

          const stream = answeringChain.streamEvents(
            {
              chat_history: mergedHistory,
              query: `${message}\n\nContexte pertinent:\n${finalResults.map(doc => doc.pageContent).join('\n\n')}`
            },
            { version: 'v1' }
          );
          this.handleStreamWithMemory(stream, emitter, llm, message);
        } catch (error) {
          console.error('❌ Erreur lors de la gestion des documents:', error);
          await this.handleFallback(llm, message, mergedHistory, emitter, fileIds, embeddings, effectiveMode);
        }
      } else {
        await this.handleFallback(llm, message, mergedHistory, emitter, fileIds, embeddings, effectiveMode);
      }
    } catch (error) {
      console.error('❌ Erreur:', error);
      await this.handleFallback(llm, message, this.conversationHistory, emitter, fileIds, embeddings, effectiveMode);
    }
    return emitter;
  }

  /**
   * Méthode de secours en cas d’erreur lors de la recherche documentée.
   */
  private async handleFallback(
    llm: BaseChatModel,
    message: string,
    history: BaseMessage[],
    emitter: EventEmitter,
    fileIds: string[],
    embeddings: Embeddings,
    mode: 'speed' | 'balanced' | 'quality'
  ) {
    const answeringChain = await this.createAnsweringChain(
      llm,
      fileIds,
      embeddings,
      mode
    );
    const stream = answeringChain.streamEvents(
      {
        chat_history: history,
        query: message
      },
      { version: 'v1' }
    );
    this.handleStreamWithMemory(stream, emitter, llm, message);
  }

  /**
   * Vérifie et initialise le vectorStore si nécessaire.
   */
  private async ensureVectorStoreInitialized(documents: Document[], embeddings: Embeddings): Promise<RAGDocumentChain> {
    const ragChain = RAGDocumentChain.getInstance();
    try {
      const hasDocuments = ragChain.isInitialized();
      if (!hasDocuments) {
        console.log('🔄 Initialisation du vector store avec les documents...');
        await ragChain.initializeVectorStoreFromDocuments(documents, embeddings);
      } else {
        console.log('✅ Vector store déjà initialisé avec des documents');
      }
      return ragChain;
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation du vector store:', error);
      throw error;
    }
  }
}

export const searchHandlers: Record<string, MetaSearchAgentType> = {
  legal: {
    searchAndAnswer: async (
      message,
      history,
      llm,
      embeddings,
      optimizationMode,
      fileIds
    ) => {
      const emitter = new EventEmitter();
      try {
        const mergedHistory: BaseMessage[] = history;
        const chain = RAGDocumentChain.getInstance();
        await chain.initializeVectorStoreFromDocuments(
          fileIds.map(fileId => new Document({
            pageContent: '',
            metadata: { source: fileId }
          })),
          embeddings
        );
        const searchChain = chain.createSearchChain(llm);
        const results = await searchChain.invoke({
          query: message,
          chat_history: mergedHistory,
          type: 'legal'
        });
        const response: SearchResponse = {
          text: results,
          sources: []
        };
        emitter.emit(
          'data',
          JSON.stringify({
            type: 'response',
            data: response.text
          })
        );
        emitter.emit('end');
      } catch (error) {
        emitter.emit(
          'error',
          JSON.stringify({
            type: 'error',
            data: error.message
          })
        );
      }
      return emitter;
    }
  },
  documents: {
    searchAndAnswer: async (
      message,
      history,
      llm,
      embeddings,
      optimizationMode,
      fileIds
    ) => {
      const emitter = new EventEmitter();
      try {
        const chain = RAGDocumentChain.getInstance();
        await chain.initializeVectorStoreFromDocuments(
          fileIds.map(fileId => new Document({
            pageContent: '',
            metadata: { source: fileId }
          })),
          embeddings
        );
        const searchChain = chain.createSearchChain(llm);
        const results = await searchChain.invoke({
          query: message,
          chat_history: history,
          type: 'documents'
        });
        const response: SearchResponse = {
          text: results,
          sources: []
        };
        emitter.emit(
          'data',
          JSON.stringify({
            type: 'response',
            data: response.text
          })
        );
        emitter.emit('end');
      } catch (error) {
        emitter.emit(
          'error',
          JSON.stringify({
            type: 'error',
            data: error.message
          })
        );
      }
      return emitter;
    }
  },
  uploads: {
    searchAndAnswer: async (
      message,
      history,
      llm,
      embeddings,
      optimizationMode,
      fileIds
    ) => {
      const emitter = new EventEmitter();
      try {
        // Analyse de la requête pour en déduire l’intention
        const queryIntent = await llm.invoke(`
Analysez cette requête et déterminez son intention principale :
1. SUMMARY (demande de résumé ou synthèse globale)
2. ANALYSIS (demande d'analyse ou d'explication)
3. SPECIFIC (question spécifique sur le contenu)
4. COMPARE (demande de comparaison)

Requête : "${message}"

Répondez uniquement avec l'intention.
        `);
        const intent = String(queryIntent.content).trim();
        console.log('🎯 Intention détectée:', intent);

        const docsArrays = await Promise.all(
          fileIds.map(async (fileId) => {
            const filePath = path.join(process.cwd(), 'uploads', fileId);
            const contentPath = `${filePath}-extracted.json`;
            await fs.promises.access(contentPath);
            const contentData = await fs.promises.readFile(contentPath, 'utf8');
            const content = JSON.parse(contentData);
            const chunkSize = 1000;
            const overlap = 100;
            const chunks: string[] = [];
            let currentChunk = '';
            let currentSize = 0;
            content.contents.forEach((text: string) => {
              currentChunk += text + ' ';
              currentSize += text.length;
              if (currentSize >= chunkSize) {
                chunks.push(currentChunk);
                currentChunk = currentChunk.slice(-overlap);
                currentSize = overlap;
              }
            });
            if (currentChunk) {
              chunks.push(currentChunk);
            }
            return chunks.map((chunk, index) => {
              const pageNumber = Math.floor(index / (chunks.length / (content.pageCount || 1))) + 1;
              return new Document({
                pageContent: chunk,
                metadata: {
                  title: content.title || 'Document sans titre',
                  source: fileId,
                  type: 'uploaded',
                  url: `/viewer/${fileId}?page=${pageNumber}`,
                  pageNumber,
                  chunkIndex: index,
                  totalChunks: chunks.length,
                  searchText: chunk.substring(0, 100).replace(/[\n\r]+/g, ' ').trim()
                }
              });
            });
          })
        );
        const flatDocs = docsArrays.flat();
        console.log('📚 Nombre total de chunks:', flatDocs.length);

        const ragChain = RAGDocumentChain.getInstance();
        await ragChain.initializeVectorStoreFromDocuments(flatDocs, embeddings);
        const chain = ragChain.createSearchChain(llm);

        let queryPrompt = message;
        switch (intent) {
          case 'SUMMARY':
            queryPrompt = 'Fais un résumé complet et structuré de ce document en te concentrant sur les points clés';
            break;
          case 'ANALYSIS':
            queryPrompt = `Analyse en détail les aspects suivants du document concernant : ${message}. Fournis une analyse structurée avec des exemples du texte.`;
            break;
          case 'SPECIFIC':
            queryPrompt = `En te basant sur le contenu du document, réponds précisément à cette question : ${message}`;
            break;
          case 'COMPARE':
            queryPrompt = `Compare et analyse en détail les différents aspects concernant : ${message}. Structure ta réponse par points de comparaison.`;
            break;
        }

        const stream = await chain.streamEvents(
          {
            query: queryPrompt,
            chat_history: history,
            type: intent.toLowerCase()
          },
          { version: 'v1' }
        );

        let sourcesEmitted = false;
        for await (const event of stream) {
          if (event.event === 'on_chain_stream') {
            emitter.emit(
              'data',
              JSON.stringify({
                type: 'response',
                data: event.data.chunk
              })
            );
          }
          if (!sourcesEmitted && event.event === 'on_chain_start') {
            const sources = flatDocs.slice(0, 5).map(doc => ({
              title: doc.metadata?.title || '',
              content: doc.metadata?.searchText || '',
              url: doc.metadata?.url,
              source: doc.metadata?.source,
              type: 'uploaded',
              pageNumber: doc.metadata?.pageNumber
            }));
            emitter.emit(
              'data',
              JSON.stringify({
                type: 'sources',
                data: sources
              })
            );
            sourcesEmitted = true;
          }
          if (event.event === 'on_chain_end') {
            emitter.emit('end');
          }
        }
      } catch (error) {
        console.error('Erreur lors de la recherche dans les documents:', error);
        emitter.emit(
          'error',
          JSON.stringify({
            type: 'error',
            data: error.message
          })
        );
      }
      return emitter;
    }
  }
};

export default MetaSearchAgent;