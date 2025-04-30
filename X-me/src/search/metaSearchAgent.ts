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
import { searchOpenAI } from '../lib/openaiSearch';
import path from 'path';
import fs from 'fs';
import { EventEmitter } from 'events';
import { StreamEvent } from '@langchain/core/tracers/log_stream';
import { IterableReadableStream } from '@langchain/core/utils/stream';
import handleImageSearch from '../chains/imageSearchAgent';
import handleExpertSearch from '../chains/expertSearchAgent';
import { RAGDocumentChain } from '../chains/rag_document_upload';
import { webSearchRetrieverPrompt, webSearchResponsePrompt } from '../prompts/webSearch';
import axios from 'axios';

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
  useOpenAISearch: boolean;
  useFirecrawl?: boolean;
  searchModel?: string;
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
  private _currentEmitter: EventEmitter | null = null;

  constructor(config: Config) {
    this.config = {
      ...config,
      useOpenAISearch: config.useOpenAISearch !== undefined ? config.useOpenAISearch : true
    };
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
          const res = await searchOpenAI(question, {
            language: 'fr',
            limit: 10,
            model: this.config.searchModel || 'gpt-4o-mini-search-preview-2025-03-11'
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
                favicon: result.favicon || `https://s2.googleusercontent.com/s2/favicons?domain_url=${result.url}`,
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
   * Transformation des résultats d'analyse Gemini en documents compatibles avec le reste du code.
   */
  private createDocumentsFromGeminiAnalysis(
    fileIds: string[],
    response: SearchResponse
  ): Document[] {
    return fileIds.map((fileId, index) => {
      // Créer un document par fichier analysé
      return new Document({
        pageContent: response.text,
        metadata: {
          source: fileId,
          title: response.sources[index]?.title || `Document ${fileId}`,
          type: 'uploaded',
          score: 0.9,
          searchText: response.text.substring(0, 100).replace(/[\n\r]+/g, ' ').trim(),
        },
      });
    });
  }

  /**
   * Analyse les documents avec Gemini et retourne les résultats sous forme de Documents.
   * Cette méthode remplace loadUploadedDocuments pour utiliser directement l'API Gemini.
   */
  private async analyzeDocumentsWithGemini(
    fileIds: string[],
    query: string,
    llm: BaseChatModel
  ): Promise<Document[]> {
    try {
      console.log('[GeminiAnalysis] Démarrage analyse pour IDs:', fileIds);
      
      // Vérifier si le modèle supporte l'analyse de fichiers
      if (!(llm as any).geminiFileAnalysis) {
        console.log('[GeminiAnalysis] ⚠️ Modèle incompatible, analyse directe annulée.');
        return [];
      }
      
      // Récupérer les chemins complets des fichiers PDF
      const uploadsDir = path.join(process.cwd(), 'uploads');
      // console.log(`[Gemini Analysis] Recherche de PDFs dans: ${uploadsDir}`); // Moins essentiel
      let filesInDir: string[] = [];
      try {
        filesInDir = fs.readdirSync(uploadsDir);
        // console.log(`[Gemini Analysis] Fichiers trouvés dans le dossier: ${filesInDir.length > 0 ? filesInDir.join(', ') : 'Aucun'}`); // Moins essentiel
      } catch (readDirError) {
        console.error(`[GeminiAnalysis] ❌ Erreur lecture dossier ${uploadsDir}:`, readDirError);
        return []; // Impossible de continuer
      }
      
      const filePaths = fileIds.map(fileId => {
        // Chercher les fichiers qui commencent par fileId et se terminent par .pdf
        const pdfFile = filesInDir.find(file => file.startsWith(fileId) && file.endsWith('.pdf'));
        
        if (pdfFile) {
          const fullPath = path.join(uploadsDir, pdfFile);
          // console.log(`[Gemini Analysis] ✅ Fichier trouvé pour ${fileId}: ${fullPath}`); // Moins essentiel
          return fullPath;
        } else {
          // console.log(`[Gemini Analysis] ❓ Fichier non trouvé pour ID ${fileId} avec le pattern 'startsWith' et '.pdf'. Essai d'autres patterns...`); // Moins essentiel
          // Essayer une recherche plus flexible si la première échoue
          const flexiblePdfFile = filesInDir.find(
            file => (file.includes(fileId) && file.endsWith('.pdf')) || file === `${fileId}.pdf`
          );
          if (flexiblePdfFile) {
            const fullPath = path.join(uploadsDir, flexiblePdfFile);
            // console.log(`[Gemini Analysis] ✅ Fichier trouvé (recherche flexible) pour ${fileId}: ${fullPath}`); // Moins essentiel
            return fullPath;
          } else {
            console.log(`[GeminiAnalysis] ❌ Aucun fichier PDF trouvé pour ID ${fileId}.`);
            return null;
          }
        }
      }).filter(Boolean) as string[];
      
      if (filePaths.length === 0) {
        console.error('[GeminiAnalysis] ❌ Aucun chemin PDF valide trouvé. Analyse annulée.');
        return [];
      }
      
      console.log(`[GeminiAnalysis] 📄 Chemins valides trouvés: ${filePaths.length}`);
      console.log(`[GeminiAnalysis] 🚀 Appel API Gemini pour analyse...`);
      
      // Utiliser l'API Gemini pour analyser les fichiers
      const response = await (llm as any).geminiFileAnalysis({
        files: filePaths,
        query: `Analyse ce document en détail et extrais les informations pertinentes pour répondre à: ${query}`,
        temperature: 0.2
      });
      
      console.log('[GeminiAnalysis] ✅ Analyse Gemini terminée.');
      
      // Créer la réponse structurée
      const searchResponse: SearchResponse = {
        text: response.text,
        sources: fileIds.map(fileId => ({
          title: `Document ${fileId}`,
          content: "Document analysé par Gemini API",
          source: fileId
        }))
      };
      
      // Convertir en documents pour compatibilité avec le reste du code
      const resultDocs = this.createDocumentsFromGeminiAnalysis(fileIds, searchResponse);
      console.log(`[GeminiAnalysis] 📚 ${resultDocs.length} documents créés.`);
      return resultDocs;
    } catch (error) {
      console.error('[GeminiAnalysis] ❌ ERREUR MAJEURE pendant analyse Gemini:', error);
      // Log plus détaillé de l'erreur si disponible
      if (error instanceof Error) {
        console.error(`[GeminiAnalysis] Error Name: ${error.name}, Message: ${error.message}`);
      }
      return [];
    }
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
    // console.log('[MetaSearch] Création de la chaîne de réponse...'); // Peut être activé pour debug fin
    return RunnableSequence.from([
      RunnableMap.from({
        query: (input: BasicChainInput) => input.query,
        chat_history: (input: BasicChainInput) => input.chat_history,
        docs: RunnableLambda.from(async (input: BasicChainInput) => {
          // console.log('[MetaSearch] Début récupération des sources...'); // Peut être activé pour debug fin
          let docs: Document[] = [];

          // 1. Recherche dans les documents uploadés avec Gemini (si applicable)
          if (fileIds.length > 0 && 
              (llm as any).modelName && 
              ((llm as any).modelName.includes('gemini-1.5')) ||
               ((llm as any).modelName.includes('gemini-2.0-flash'))) {
            try {
              // Tenter l'analyse directe avec Gemini
              const uploadedDocs = await this.analyzeDocumentsWithGemini(fileIds, input.query, llm);
              console.log('[MetaSearch] Résultat analyse Gemini (docs): ', uploadedDocs.length);
              if (uploadedDocs.length > 0) {
                docs = uploadedDocs;
              }
            } catch (error) {
              console.error('[MetaSearch] ❌ Erreur analyse Gemini (dans answering chain):', error);
            }
          }

          // 2. Recherche d'experts (si activée)
          if (this.config.searchDatabase) {
            try {
              // console.log('[MetaSearch] 👥 Recherche d\'experts...'); // Moins essentiel
              const expertResults = await this.searchExperts(input.query, embeddings, llm);
              if (expertResults.length > 0) {
                docs = [...docs, ...expertResults];
                // console.log('[MetaSearch] Experts trouvés:', expertResults.length);
              }
            } catch (error) {
              console.error('[MetaSearch] ❌ Erreur recherche experts:', error);
            }
          }

          // 3. Recherche web (si activée ET aucun fichier fourni)
          if (this.config.searchWeb && fileIds.length === 0) {
            try {
              // console.log('[MetaSearch] 🌐 Recherche web...'); // Moins essentiel
              const webResults = await this.performWebSearch(input.query);
              if (webResults.length > 0) {
                docs = [...docs, ...webResults];
                // console.log('[MetaSearch] Résultats web trouvés:', webResults.length);
              }
            } catch (error) {
              console.error('[MetaSearch] ❌ Erreur recherche web:', error);
            }
          } else if (fileIds.length > 0) {
            // console.log('[MetaSearch] 📂 Documents présents, recherche web Firecrawl ignorée.');
          }

          // console.log('[MetaSearch] 🔍 DEBUG - Avant rerankDocs - Mode:', optimizationMode, 'Query:', input.query); // Debug détaillé
          // console.log('[MetaSearch] Docs avant rerank:', docs.length); // Debug détaillé
          return this.rerankDocs(
            input.query,
            docs,
            fileIds,
            embeddings,
            optimizationMode,
            llm,
            fileIds.length > 0
          );
        }).withConfig({ runName: 'FinalSourceRetriever' }),
      }),
      RunnableMap.from({
        query: (input) => input.query,
        chat_history: (input) => input.chat_history,
        date: () => new Date().toISOString(),
        context: (input) => {
          // console.log('[MetaSearch] Préparation du contexte final...'); // Moins essentiel
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
    try {
      console.log('🌐 Démarrage de la recherche web avec Firecrawl...');
      const results = await this.searchWeb(query);
      
      return results.map(result => 
        new Document({
          pageContent: result.pageContent,
          metadata: {
            title: result.metadata.title,
            url: result.metadata.url,
            type: 'web',
            source: 'web',
            displayDomain: new URL(result.metadata.url).hostname.replace('www.', ''),
            favicon: result.metadata.favicon || `https://s2.googleusercontent.com/s2/favicons?domain_url=${result.metadata.url}`,
            linkText: 'Voir la page',
            ...(result.metadata.img_src && { img_src: result.metadata.img_src }),
          },
        })
      );
    } catch (error) {
      console.error('❌ Erreur lors de la recherche web:', error);
      return [];
    }
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
   * Extraction d'informations clés dans le contenu.
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
   * Gestion du stream d'événements pour la génération des réponses et des sources.
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
    let foundExperts: any[] = []; 
    
    // Vérifier si la requête est d'ordre professionnel ou entrepreneurial
    const isBusinessRelatedQuery = await this.isBusinessOrProfessionalQuery(originalQuery, llm);
    
    for await (const event of stream) {
      if (event.event === 'on_chain_stream' && event.name === 'FinalResponseGenerator') {
        fullAssistantResponse += event.data.chunk;
        emitter.emit(
          'data',
          JSON.stringify({ type: 'response', data: event.data.chunk })
        );
      } else if (event.event === 'on_chain_end') {
        if (event.name === 'FinalSourceRetriever') {
          const sources = event.data.output;
          const normalizedSources = sources?.map(this.normalizeSource) || [];
          
          // Filtrer les experts parmi les sources
          foundExperts = normalizedSources
            .filter(source => source.metadata?.type === 'expert')
            .map(source => source.metadata?.expertData)
            .filter(Boolean);
          
          console.log(`🔍 Experts trouvés pour suggestions: ${foundExperts.length}`);
          
          emitter.emit(
            'data',
            JSON.stringify({
              type: 'sources',
              data: normalizedSources,
              illustrationImage: normalizedSources[0]?.metadata?.illustrationImage || null,
              imageTitle: normalizedSources[0]?.metadata?.imageTitle || null
            })
          );

          // Génération immédiate des suggestions dès la réception des sources
          // UNIQUEMENT si la requête est d'ordre professionnel/entrepreneurial
          if (!hasEmittedSuggestions && isBusinessRelatedQuery) {
            try {
              console.log('🚀 Génération de suggestions IMMÉDIATE dès la réception des sources');
              
              // Amélioration du prompt de suggestions basé sur suggestionGeneratorAgent.ts
              const suggestionPrompt = `
Vous êtes un assistant spécialisé dans la génération de suggestions pour une intelligence artificielle d'entreprise.

Voici la question initiale de l'utilisateur : "${originalQuery}"

Votre tâche est de générer 4-5 suggestions de questions percutantes et pertinentes que l'utilisateur pourrait poser en complément de sa demande initiale.

INSTRUCTIONS IMPORTANTES :
- Les suggestions doivent être formulées à la première personne, comme si l'utilisateur les posait.
- Chaque suggestion doit se terminer par un point d'interrogation.
- Concentrez-vous sur des questions complémentaires et approfondies, qui poursuivent la conversation de manière naturelle.
- Proposez des questions qui explorent différents aspects liés au sujet initial.
- Adaptez les suggestions au domaine d'activité ou au contexte détecté dans la question initiale.
- Privilégiez des suggestions précises et exploitables sur le plan professionnel.

Listez seulement les questions, sans numérotation, chaque suggestion sur une ligne différente.

Exemples de bonnes suggestions :
- Si la question portait sur les CGV : "Quelles clauses spécifiques devrais-je inclure pour me protéger contre les impayés ?"
- Si la question portait sur un business plan : "Comment puis-je calculer précisément mon seuil de rentabilité ?"
- Si la question portait sur l'entrepreneuriat : "Quelles sont les aides financières disponibles pour mon projet dans ma région ?"`;

              // Faire l'appel au modèle avec température basse pour des suggestions plus pertinentes
              const tempModel = llm as any;
              const originalTemp = tempModel.temperature || 0.7;
              tempModel.temperature = 0.2;
              
              const suggestionsResponse = await llm.invoke(suggestionPrompt);
              
              // Restaurer la température originale
              tempModel.temperature = originalTemp;
              
              const suggestions = String(suggestionsResponse.content)
                .split('\n')
                .filter(s => s.trim())
                .filter(s => s.includes('?')) // S'assurer que ce sont des questions
                .map(s => s.trim().replace(/^[•\-\s]+/, '')) // Enlever les puces ou tirets
                .slice(0, 4); // Limiter à 4 suggestions
              
              console.log('✅ Suggestions générées améliorées:', suggestions);
              
              // Format correct pour les suggestions
              emitter.emit(
                'data',
                JSON.stringify({
                  type: 'suggestions',
                  data: {
                    suggestions: suggestions,
                    suggestedExperts: foundExperts || []
                  },
                  messageId: ''  // Ce champ sera rempli côté client avec le bon messageId
                })
              );
              hasEmittedSuggestions = true;
              console.log('✅ Événement suggestions envoyé AVANT la fin de la réponse');
            } catch (error) {
              console.error('❌ Erreur lors de la génération des suggestions après sources:', error);
            }
          } else if (!isBusinessRelatedQuery) {
            console.log('ℹ️ Pas de suggestions générées car la requête n\'est pas d\'ordre professionnel/entrepreneurial');
          }
        }
        
        if (event.name === 'FinalResponseGenerator') {
          // Comme secours, générer des suggestions si elles n'ont pas été générées avant
          // UNIQUEMENT si la requête est d'ordre professionnel/entrepreneurial
          if (!hasEmittedSuggestions && isBusinessRelatedQuery) {
            try {
              console.log('🔄 Génération de suggestions de secours en fin de réponse');
              
              // Utiliser le même prompt amélioré mais avec la réponse complète pour plus de contexte
              const backupSuggestionPrompt = `
Vous êtes un assistant spécialisé dans la génération de suggestions pour une intelligence artificielle d'entreprise.

Voici la question initiale de l'utilisateur : "${originalQuery}"

Voici la réponse qui a été donnée : 
"""
${fullAssistantResponse.substring(0, 1000)}
"""

Votre tâche est de générer 4-5 suggestions de questions percutantes et pertinentes que l'utilisateur pourrait poser en complément, après avoir reçu cette réponse.

INSTRUCTIONS IMPORTANTES :
- Les suggestions doivent être formulées à la première personne, comme si l'utilisateur les posait.
- Chaque suggestion doit se terminer par un point d'interrogation.
- Concentrez-vous sur des questions complémentaires qui approfondissent les points abordés dans la réponse.
- Adaptez les suggestions au domaine d'activité ou au contexte détecté.
- Privilégiez des suggestions précises et exploitables sur le plan professionnel.
- Évitez les questions trop générales ou évidentes.

Listez seulement les questions, sans numérotation, chaque suggestion sur une ligne différente.`;
              
              // Faire l'appel au modèle avec température basse
              const tempModel = llm as any;
              const originalTemp = tempModel.temperature || 0.7;
              tempModel.temperature = 0.2;
              
              const suggestionsResponse = await llm.invoke(backupSuggestionPrompt);
              
              // Restaurer la température originale
              tempModel.temperature = originalTemp;
              
              const suggestions = String(suggestionsResponse.content)
                .split('\n')
                .filter(s => s.trim())
                .filter(s => s.includes('?')) // S'assurer que ce sont des questions
                .map(s => s.trim().replace(/^[•\-\s]+/, '')) // Enlever les puces ou tirets
                .slice(0, 4); // Limiter à 4 suggestions
              
              console.log('✅ Suggestions de secours générées améliorées:', suggestions);
              
              // Format correct pour les suggestions
              emitter.emit(
                'data',
                JSON.stringify({
                  type: 'suggestions',
                  data: {
                    suggestions: suggestions,
                    suggestedExperts: foundExperts || []
                  },
                  messageId: ''  // Ce champ sera rempli côté client
                })
              );
              hasEmittedSuggestions = true;
            } catch (error) {
              console.error('❌ Erreur lors de la génération des suggestions de secours:', error);
            }
          }
          
          this.updateMemory(new AIMessage(fullAssistantResponse.trim()));
          emitter.emit('end');
        }
      } else {
        emitter.emit(event.event, event.data);
      }
    }
  }

  /**
   * Vérifie si la requête est liée à un contexte professionnel ou entrepreneurial
   */
  private async isBusinessOrProfessionalQuery(query: string, llm: BaseChatModel): Promise<boolean> {
    try {
      console.log('🔍 Vérification si la requête est d\'ordre professionnel:', query);
      
      // Prompt pour analyser si la requête est liée au monde professionnel ou des affaires
      const analysisPrompt = `
Analysez cette question et déterminez si elle est liée à un contexte professionnel, entrepreneurial ou d'aide à l'entreprise.

Question: "${query}"

Évaluez si la question concerne l'un des domaines suivants :
- Business, entrepreneuriat, création d'entreprise
- Gestion, management, ressources humaines
- Finance, comptabilité, fiscalité
- Marketing, vente, développement commercial
- Droit des affaires, réglementation professionnelle
- Conseils professionnels ou carrière
- Plans d'affaires, levées de fonds
- Organisation du travail, productivité professionnelle
- Formation professionnelle, développement de compétences en entreprise

Répondez strictement par "OUI" ou "NON".
`;
      
      // Utiliser une température basse pour plus de précision
      const tempModel = llm as any;
      const originalTemp = tempModel.temperature || 0.7;
      tempModel.temperature = 0;
      
      const response = await llm.invoke(analysisPrompt);
      
      // Restaurer la température originale
      tempModel.temperature = originalTemp;
      
      const answer = String(response.content).trim().toUpperCase();
      const isBusinessRelated = answer.includes('OUI');
      
      console.log(`🔍 Résultat analyse requête: ${isBusinessRelated ? 'Contexte professionnel' : 'Contexte non-professionnel'}`);
      return isBusinessRelated;
    } catch (error) {
      console.error('❌ Erreur lors de l\'analyse de la requête:', error);
      // En cas d'erreur, par défaut, on considère que c'est professionnel pour ne pas bloquer les suggestions
      return true;
    }
  }

  /**
   * Recherche d'experts.
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
   * Recherche d'images.
   */
  private async handleImageSearch(query: string, llm: BaseChatModel) {
    try {
      console.log('🖼️ Démarrage de la recherche d\'images pour:', query);
      const results = await handleImageSearch({ query, chat_history: [] }, llm);
      console.log('🖼️ Résultats de la recherche d\'images:', results?.length || 0, 'images trouvées');
      
      if (!results || !Array.isArray(results) || results.length === 0) {
        console.warn('⚠️ Aucun résultat d\'image trouvé, utilisation d\'une image par défaut');
        // Retourner une image par défaut si aucun résultat
        return [{
          url: "https://images.unsplash.com/photo-1600880292089-90a7e086ee0c",
          alt: "Image par défaut",
          title: "Image par défaut",
          width: 800,
          height: 600,
          source: "default",
          tags: ["business", "professional", "default"],
          img_src: "https://images.unsplash.com/photo-1600880292089-90a7e086ee0c"
        }];
      }
      
      return results;
    } catch (error) {
      console.error('❌ Erreur lors de la recherche d\'images:', error);
      // Retourner une image par défaut en cas d'erreur
      return [{
        url: "https://images.unsplash.com/photo-1600880292089-90a7e086ee0c",
        alt: "Image en cas d'erreur",
        title: "Image par défaut (erreur)",
        width: 800,
        height: 600,
        source: "default",
        tags: ["business", "professional", "default"],
        img_src: "https://images.unsplash.com/photo-1600880292089-90a7e086ee0c"
      }];
    }
  }

  /**
   * Recherche web à partir de la query.
   */
  private async searchWeb(query: string): Promise<SearchResult[]> {
    try {
      console.log('🌐 Recherche web pour:', query);
      
      // Utiliser Firecrawl directement comme solution primaire
      if (this.config.useFirecrawl) {
        console.log('🔥 Utilisation de Firecrawl pour la recherche');
        const { searchFirecrawl } = require('../lib/firecrawlSearch');

        console.log('🔄 Démarrage appel searchFirecrawl');
        const firecrawlResults = await searchFirecrawl(query, { 
          limit: 5,
          maxDepth: 1,
          timeLimit: 30,
          useCache: true
        });
        console.log('✅ Résultats Firecrawl reçus', {
          resultCount: firecrawlResults.results?.length || 0,
          activitiesCount: firecrawlResults.activities?.length || 0,
          firstActivity: firecrawlResults.activities?.[0]?.message || 'aucune'
        });
        
        // Transmettre les activités de recherche si disponibles
        if (this._currentEmitter && firecrawlResults.activities?.length > 0) {
          console.log(`📡 Transmission de ${firecrawlResults.activities.length} activités Firecrawl`);
          
          // Créer des activités factices pour tester
          const testActivities = [
            {
              type: 'search',
              status: 'completed',
              message: 'Test de recherche',
              timestamp: new Date().toISOString(),
              depth: 1,
              maxDepth: 2
            },
            {
              type: 'analyze',
              status: 'in_progress',
              message: 'Analyse en cours',
              timestamp: new Date().toISOString(), 
              depth: 1,
              maxDepth: 2
            }
          ];
          
          console.log('🧪 Ajout de 2 activités de test');
          
          // Transmettre chaque activité individuellement (incluant les tests)
          [...testActivities, ...firecrawlResults.activities].forEach((activity: any, index: number) => {
            console.log(`📤 Envoi activité ${index+1}:`, activity.type, activity.message);
            
            try {
              this._currentEmitter.emit(
                'data',
                JSON.stringify({
                  type: 'researchActivity',
                  data: activity
                })
              );
              console.log(`✅ Activité ${index+1} envoyée`);
            } catch (error) {
              console.error(`❌ Erreur lors de l'envoi de l'activité ${index+1}:`, error);
            }
          });
        } else {
          console.log('⚠️ Impossible de transmettre les activités:', {
            hasEmitter: !!this._currentEmitter,
            activitiesCount: firecrawlResults.activities?.length || 0
          });
        }
        
        return firecrawlResults.results.map(result => ({
          pageContent: result.content,
          metadata: {
            title: result.title,
            url: result.url,
            type: 'web',
            score: 0.8,
            ...(result.img_src && { img_src: result.img_src }),
            favicon: result.favicon || `https://s2.googleusercontent.com/s2/favicons?domain_url=${result.url || 'https://firecrawl.dev'}`
          }
        }));
      }
      
      // Si Firecrawl n'est pas configuré, utiliser OpenAI search en dernier recours
      if (this.config.useOpenAISearch) {
        try {
          console.log('ℹ️ Utilisation d\'OpenAI search comme solution de repli');
          const res = await searchOpenAI(query, {
            language: 'fr',
            limit: 10,
            model: this.config.searchModel || 'gpt-4o-mini'
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
        } catch (openaiError) {
          console.error('❌ Erreur lors de la recherche OpenAI:', openaiError);
          if (axios.isAxiosError(openaiError)) {
            console.error('❌ Détails de l\'erreur Axios:');
            console.error(`  Status: ${openaiError.response?.status}`);
            console.error(`  Message: ${openaiError.message}`);
            console.error(`  Données: ${JSON.stringify(openaiError.response?.data || {})}`);
          }
          
          // Si OpenAI échoue, générer des résultats simulés
          const { generateSimulatedResults } = require('../lib/firecrawlSearch');
          const simResults = generateSimulatedResults(query);
          return simResults.results.map(result => ({
            pageContent: result.content,
            metadata: {
              title: result.title,
              url: result.url,
              type: 'web',
              score: 0.3,
              favicon: result.favicon
            }
          }));
        }
      }
      
      // Aucune option n'est configurée, renvoyer un tableau vide
      return [];
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
    optimizationMode: 'speed' | 'balanced' | 'quality',
    hasUploadedDocs: boolean = false
  ): Promise<{
    images: any[];
    experts: SearchResult[];
    webResults: SearchResult[];
  }> {
    console.log('🔄 Démarrage des recherches parallèles');
    const searchTasks = {
      // Toujours chercher des images, quel que soit le mode d'optimisation
      images: this.handleImageSearch(query, llm),
      experts: this.config.searchDatabase
        ? this.searchExperts(query, embeddings, llm)
        : Promise.resolve([]),
      // Ne pas faire de recherche web si des documents sont chargés
      webResults: (!hasUploadedDocs && this.config.searchWeb)
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
    llm: BaseChatModel,
    hasUploadedDocs: boolean = false
  ) {
    console.log('🔍 Mode d\'optimisation:', optimizationMode);
    console.log('🔍 Query pour la recherche d\'image:', query);

    // Éviter de refaire des recherches si les documents contiennent déjà des résultats web
    const hasWebResults = docs.some(doc => doc.metadata?.type === 'web');
    const hasExpertResults = docs.some(doc => doc.metadata?.type === 'expert');
    
    // Si nous avons déjà des résultats web et experts, enrichir seulement avec des images si nécessaire
    if (hasWebResults && (hasExpertResults || !this.config.searchDatabase)) {
      console.log('🔍 Réutilisation des résultats web et experts existants');
      
      let enrichedDocs = docs;
      // Toujours chercher des images quel que soit le mode d'optimisation
      console.log('🔍 Recherche d\'image (simplifiée) indépendamment du mode d\'optimisation');
      const images = await this.handleImageSearch(query, llm);
      if (images && images.length > 0) {
        console.log('🔍 Image trouvée et ajoutée aux résultats existants');
        enrichedDocs = docs.map(doc => ({
          ...doc,
          metadata: {
            ...doc.metadata,
            illustrationImage: images[0].img_src,
            imageTitle: images[0].title
          }
        }));
      }
      
      return enrichedDocs.slice(0, 15);
    }

    const { images, experts, webResults } = await this.parallelSearchOperations(
      query,
      llm,
      embeddings,
      optimizationMode,
      hasUploadedDocs
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
   * Préparation optimisée des documents pour l'analyse.
   */
  private prepareDocumentsForAnalysis(
    docs: Document[],
    message: string
  ): Document[] {
    console.log('📚 Préparation des documents pour analyse');
    // Ajouter un contexte sur la requête en cours à chaque document
    return docs.map(doc => {
      return new Document({
        pageContent: doc.pageContent,
        metadata: {
          ...doc.metadata,
          queryContext: message.substring(0, 100), // Ajouter un contexte de requête limité
          analysisDate: new Date().toISOString()
        }
      });
    });
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
    const emitter = new EventEmitter();
    this._currentEmitter = emitter; // Stocker l'émetteur courant
    console.log(`[MetaSearch] Nouvelle requête reçue. Mode: ${optimizationMode}, Fichiers: ${fileIds.length}`);

    try {
      this.updateMemory(new HumanMessage(message));
      const mergedHistory: BaseMessage[] = [
        ...this.conversationHistory,
        ...history,
      ];

      // Déterminer si on tente l'analyse directe Gemini
      const modelName = (llm as any).modelName as string | undefined;
      const hasFiles = fileIds.length > 0;
      const isGemini15 = modelName?.includes('gemini-1.5');
      const isGemini20Flash = modelName?.includes('gemini-2.0-flash');
      
      const useGeminiDirectAnalysis = hasFiles && modelName && (isGemini15 || isGemini20Flash);

      if (useGeminiDirectAnalysis) {
        console.log('[MetaSearch] 🔍 Tentative analyse directe avec Gemini...');
        try {
          const docs = await this.analyzeDocumentsWithGemini(fileIds, message, llm);
          console.log(`[MetaSearch] Résultat analyse directe: ${docs.length} documents.`);
          
          if (docs.length > 0) {
            // Envoyer les sources (simplifié)
            emitter.emit(
              'data',
              JSON.stringify({
                type: 'sources',
                data: docs.map(doc => ({ metadata: doc.metadata })) // Envoyer juste les métadonnées
              })
            );
            
            // Créer la chaîne de réponse principale
            const answeringChain = await this.createAnsweringChain(
              llm,
              fileIds, // Important de passer les fileIds pour le contexte
              embeddings,
              optimizationMode
            );
            
            // Générer la réponse en utilisant les docs de Gemini
            console.log('[MetaSearch] Génération réponse basée sur analyse Gemini...');
            const stream = answeringChain.streamEvents(
              {
                chat_history: mergedHistory,
                query: message // Utiliser le message original comme query
              },
              { version: 'v1' }
            );
            
            this.handleStreamWithMemory(stream, emitter, llm, message);
            return emitter; // Sortir car l'analyse directe a fonctionné
          } else {
            console.log(`[MetaSearch] Analyse directe Gemini n'a retourné aucun document, passage au fallback.`);
          }
        } catch (error) {
          console.error('[MetaSearch] ❌ Erreur analyse directe Gemini:', error);
          console.log('[MetaSearch] ⚠️ Retour à la méthode standard.');
        }
      } else if (hasFiles) { // Modifié pour être plus clair: on a des fichiers mais pas le bon modèle
          console.log('[MetaSearch] ℹ️ Modèle non compatible pour analyse directe Gemini ou erreur nom modèle.');
      }

      // --- Fallback ou cas sans analyse directe --- 
      console.log('[MetaSearch] Utilisation du chemin standard (Recherche Web/Experts si applicable)...');
      
      // Appel standard à la chaîne de réponse qui gère interneement web/expert
      const answeringChain = await this.createAnsweringChain(
        llm,
        fileIds, // Passer fileIds même si vide, la logique interne gère
        embeddings,
        optimizationMode
      );

      const stream = answeringChain.streamEvents(
        {
          chat_history: mergedHistory,
          query: message
        },
        { version: 'v1' }
      );
      this.handleStreamWithMemory(stream, emitter, llm, message);

    } catch (error) {
      console.error('[MetaSearch] ❌ ERREUR MAJEURE searchAndAnswer:', error);
      emitter.emit('error', JSON.stringify({ type: 'error', data: 'Erreur interne du serveur.' }));
      emitter.emit('end');
    }
    
    // Nettoyer la référence
    this._currentEmitter = null;
    
    return emitter;
  }

  /**
   * Méthode de secours en cas d'erreur lors de la recherche documentée.
   * NOTE: Cette méthode pourrait devenir moins pertinente avec l'approche Gemini directe,
   * mais gardée pour l'instant pour les erreurs non liées à l'analyse directe.
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
    console.log('[MetaSearch] Appel de la méthode Fallback...');
    try {
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
    } catch (fallbackError) {
      console.error('[MetaSearch] ❌ ERREUR dans handleFallback:', fallbackError);
      emitter.emit('error', JSON.stringify({ type: 'error', data: 'Erreur interne (fallback) du serveur.' }));
      emitter.emit('end');
    }
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
        // Analyse de la requête pour en déduire l'intention
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