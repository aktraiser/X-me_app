import express from 'express';
import handleImageSearch from '../chains/imageSearchAgent';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { getAvailableChatModelProviders } from '../lib/providers';
import { HumanMessage, AIMessage } from '@langchain/core/messages';
import logger from '../utils/logger';
import { ChatOpenAI } from '@langchain/openai';

const router = express.Router();

interface ChatModel {
  provider: string;
  model: string;
  customOpenAIBaseURL?: string;
  customOpenAIKey?: string;
}

interface ImageSearchBody {
  query: string;
  chatHistory: any[];
  chatModel?: ChatModel;
}

router.post('/', async (req, res) => {
  try {
    let body: ImageSearchBody = req.body;
    console.log("📸 Requête de recherche d'images reçue:", body.query);

    const chatHistory = body.chatHistory.map((msg: any) => {
      if (msg.role === 'user') {
        return new HumanMessage(msg.content);
      } else if (msg.role === 'assistant') {
        return new AIMessage(msg.content);
      }
    });

    const chatModelProviders = await getAvailableChatModelProviders();

    const chatModelProvider =
      body.chatModel?.provider || Object.keys(chatModelProviders)[0];
    const chatModel =
      body.chatModel?.model ||
      Object.keys(chatModelProviders[chatModelProvider])[0];

    let llm: BaseChatModel | undefined;

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

    if (!llm) {
      return res.status(400).json({ message: 'Invalid model selected' });
    }

    console.log('🔍 Recherche d\'images avec le modèle:', chatModel, 'et la requête:', body.query);
    
    const images = await handleImageSearch(
      { query: body.query, chat_history: chatHistory },
      llm,
    );

    console.log('📸 Résultat de la recherche d\'images:', images?.length || 0, 'images trouvées');

    if (!images || !Array.isArray(images)) {
      console.warn('⚠️ La recherche d\'images a retourné un résultat non valide');
      return res.status(200).json({ images: [] });
    }

    if (images.length === 0) {
      console.log('⚠️ Aucune image trouvée, vérifier la configuration de la base Supabase');
    }

    res.status(200).json({ images });
  } catch (err) {
    console.error('❌ Erreur détaillée dans la recherche d\'images:', err);
    if (err instanceof Error) {
      console.error('❌ Message d\'erreur:', err.message);
      console.error('❌ Stack trace:', err.stack);
    }
    res.status(500).json({ 
      message: 'Une erreur est survenue lors de la recherche d\'images.', 
      error: err instanceof Error ? err.message : String(err)
    });
    logger.error(`Error in image search: ${err.message}`);
  }
});

export default router;
