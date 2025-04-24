import express from 'express';
import logger from '../utils/logger';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { Embeddings } from '@langchain/core/embeddings';
import { ChatOpenAI } from '@langchain/openai';
import {
  getAvailableChatModelProviders,
  getAvailableEmbeddingModelProviders,
} from '../lib/providers';
import { searchHandlers } from '../websocket/messageHandler';
import { AIMessage, BaseMessage, HumanMessage } from '@langchain/core/messages';
import { MetaSearchAgent, MetaSearchAgentType } from '../search/metaSearchAgent';
import { isFirecrawlEnabled } from '../config';

const router = express.Router();

// Modèle de chat par défaut
const DEFAULT_CHAT_MODEL = 'gpt-4o-mini';

interface ChatModel {
  provider: string;
  model: string;
  customOpenAIBaseURL?: string;
  customOpenAIKey?: string;
}

interface EmbeddingModel {
  provider: string;
  model: string;
}

interface ChatRequestBody {
  optimizationMode: 'speed' | 'balanced';
  focusMode: string;
  chatModel?: ChatModel;
  embeddingModel?: EmbeddingModel;
  query: string;
  history: Array<[string, string]>;
  useFirecrawl?: boolean;  // Nouvelle option pour utiliser Firecrawl
}

router.post('/', async (req, res) => {
  try {
    const body: ChatRequestBody = req.body;

    if (!body.focusMode || !body.query) {
      return res.status(400).json({ message: 'Missing focus mode or query' });
    }

    body.history = body.history || [];
    body.optimizationMode = body.optimizationMode || 'balanced';
    
    // Utiliser Firecrawl par défaut si disponible
    const firecrawlEnabled = isFirecrawlEnabled();
    body.useFirecrawl = body.useFirecrawl !== undefined 
      ? body.useFirecrawl 
      : firecrawlEnabled;

    const history: BaseMessage[] = body.history.map((msg) => {
      if (msg[0] === 'human') {
        return new HumanMessage({
          content: msg[1],
        });
      } else {
        return new AIMessage({
          content: msg[1],
        });
      }
    });

    const [chatModelProviders, embeddingModelProviders] = await Promise.all([
      getAvailableChatModelProviders(),
      getAvailableEmbeddingModelProviders(),
    ]);

    const chatModelProvider =
      body.chatModel?.provider || Object.keys(chatModelProviders)[0];
    const chatModel =
      body.chatModel?.model ||
      Object.keys(chatModelProviders[chatModelProvider])[0] ||
      DEFAULT_CHAT_MODEL;

    const embeddingModelProvider =
      body.embeddingModel?.provider || Object.keys(embeddingModelProviders)[0];
    const embeddingModel =
      body.embeddingModel?.model ||
      Object.keys(embeddingModelProviders[embeddingModelProvider])[0];

    let llm: BaseChatModel | undefined;
    let embeddings: Embeddings | undefined;

    if (body.chatModel?.provider === 'custom_openai') {
      if (
        !body.chatModel?.customOpenAIBaseURL ||
        !body.chatModel?.customOpenAIKey
      ) {
        return res
          .status(400)
          .json({ message: 'Missing custom OpenAI base URL or key' });
      }

      llm = new ChatOpenAI({
        modelName: body.chatModel.model,
        openAIApiKey: body.chatModel.customOpenAIKey,
        temperature: 0.7,
        configuration: {
          baseURL: body.chatModel.customOpenAIBaseURL,
        },
      }) as unknown as BaseChatModel;
    } else if (
      chatModelProviders[chatModelProvider] &&
      chatModelProviders[chatModelProvider][chatModel]
    ) {
      llm = chatModelProviders[chatModelProvider][chatModel]
        .model as unknown as BaseChatModel | undefined;
    }

    if (
      embeddingModelProviders[embeddingModelProvider] &&
      embeddingModelProviders[embeddingModelProvider][embeddingModel]
    ) {
      embeddings = embeddingModelProviders[embeddingModelProvider][
        embeddingModel
      ].model as Embeddings | undefined;
    }

    if (!llm || !embeddings) {
      return res.status(400).json({ message: 'Invalid model selected' });
    }

    let searchHandler: MetaSearchAgentType;

    if (body.focusMode in searchHandlers) {
      searchHandler = searchHandlers[body.focusMode];
    } else {
      // Configuration par défaut avec MetaSearchAgent
      const metaConfig = {
        activeEngines: ['google', 'bing'],
        rerank: true,
        rerankThreshold: 0.7,
        searchWeb: true,
        summarizer: true,
        searchDatabase: true,
        useOpenAISearch: true,
        useFirecrawl: body.useFirecrawl,
        searchModel: DEFAULT_CHAT_MODEL
      };
      
      const metaSearchAgent = new MetaSearchAgent(metaConfig);
      searchHandler = metaSearchAgent;
    }

    const emitter = await searchHandler.searchAndAnswer(
      body.query,
      history,
      llm,
      embeddings,
      body.optimizationMode,
      [],
    );

    let message = '';
    let sources = [];

    emitter.on('data', (data) => {
      const parsedData = JSON.parse(data);
      if (parsedData.type === 'response') {
        message += parsedData.data;
      } else if (parsedData.type === 'sources') {
        sources = parsedData.data;
      }
    });

    emitter.on('end', () => {
      res.status(200).json({ message, sources });
    });

    emitter.on('error', (data) => {
      const parsedData = JSON.parse(data);
      res.status(500).json({ message: parsedData.data });
    });
  } catch (err: any) {
    logger.error(`Error in getting search results: ${err.message}`);
    res.status(500).json({ message: 'An error has occurred.' });
  }
});

export default router;
