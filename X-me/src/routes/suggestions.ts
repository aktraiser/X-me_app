import express from 'express';
import generateSuggestions, { SuggestionGeneratorInput } from '../chains/suggestionGeneratorAgent';
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

interface SuggestionsBody {
  chatHistory: any[];
  chatModel?: ChatModel;
  existingExperts?: any[];
}

router.post('/', async (req, res) => {
  try {
    logger.info(`📥 Route /suggestions - Requête reçue`);
    let body: SuggestionsBody = req.body;

    if (!body.chatHistory || !Array.isArray(body.chatHistory)) {
      logger.error(`❌ Route /suggestions - chatHistory manquant ou invalide`);
      return res.status(400).json({ 
        message: 'chatHistory invalide, doit être un tableau de messages',
        success: false 
      });
    }

    logger.info(`📝 Traitement d'une demande de suggestions avec ${body.chatHistory.length} messages`);
    
    // Convertir l'historique des messages
    const chatHistory = body.chatHistory.map((msg: any) => {
      if (msg.role === 'user') {
        return new HumanMessage(msg.content);
      } else if (msg.role === 'assistant') {
        return new AIMessage(msg.content);
      }
      // Si le rôle n'est ni utilisateur ni assistant, on ignore ce message
      logger.warn(`⚠️ Message ignoré avec rôle inconnu: ${msg.role}`);
      return null;
    }).filter(Boolean); // Filtrer les valeurs null
    
    logger.info(`🔄 Historique converti: ${chatHistory.length} messages valides`);

    // Obtenir les modèles de chat disponibles
    let chatModelProviders;
    try {
      chatModelProviders = await getAvailableChatModelProviders();
      logger.info(`✅ Modèles de chat récupérés: ${Object.keys(chatModelProviders).join(', ')}`);
    } catch (providerError) {
      logger.error(`❌ Erreur lors de la récupération des modèles: ${providerError.message}`);
      return res.status(500).json({ 
        message: 'Erreur lors de la récupération des modèles',
        success: false 
      });
    }

    // Obtenir le fournisseur et le modèle
    const chatModelProvider = body.chatModel?.provider || Object.keys(chatModelProviders)[0];
    const chatModel = body.chatModel?.model || Object.keys(chatModelProviders[chatModelProvider])[0];
    
    logger.info(`🤖 Modèle sélectionné: ${chatModelProvider}/${chatModel}`);

    let llm: BaseChatModel | undefined;

    // Configuration du modèle selon le fournisseur
    if (body.chatModel?.provider === 'custom_openai') {
      if (!body.chatModel?.customOpenAIBaseURL || !body.chatModel?.customOpenAIKey) {
        logger.error(`❌ URL de base ou clé OpenAI personnalisée manquante`);
        return res.status(400).json({ 
          message: 'URL de base ou clé OpenAI personnalisée manquante',
          success: false 
        });
      }

      logger.info(`🔑 Utilisation d'OpenAI personnalisé: ${body.chatModel.customOpenAIBaseURL}`);
      
      try {
        llm = new ChatOpenAI({
          modelName: body.chatModel.model,
          openAIApiKey: body.chatModel.customOpenAIKey,
          temperature: 0.7,
          configuration: {
            baseURL: body.chatModel.customOpenAIBaseURL,
          },
        }) as unknown as BaseChatModel;
      } catch (openaiError) {
        logger.error(`❌ Erreur lors de l'initialisation d'OpenAI personnalisé: ${openaiError.message}`);
        return res.status(500).json({ 
          message: 'Erreur lors de l\'initialisation du modèle OpenAI personnalisé',
          success: false 
        });
      }
    } else if (chatModelProviders[chatModelProvider] && chatModelProviders[chatModelProvider][chatModel]) {
      logger.info(`🔑 Utilisation du modèle standard: ${chatModelProvider}/${chatModel}`);
      
      try {
        llm = chatModelProviders[chatModelProvider][chatModel].model as unknown as BaseChatModel | undefined;
      } catch (modelError) {
        logger.error(`❌ Erreur lors de l'initialisation du modèle standard: ${modelError.message}`);
        return res.status(500).json({ 
          message: 'Erreur lors de l\'initialisation du modèle',
          success: false 
        });
      }
    }

    if (!llm) {
      logger.error(`❌ Modèle non disponible ou invalide: ${chatModelProvider}/${chatModel}`);
      return res.status(400).json({ 
        message: 'Modèle sélectionné invalide ou non disponible',
        success: false 
      });
    }

    // Vérifier si nous avons des experts existants
    const hasExistingExperts = Array.isArray(body.existingExperts) && body.existingExperts.length > 0;
    
    if (hasExistingExperts) {
      logger.info(`👥 Utilisation de ${body.existingExperts.length} experts préexistants pour les suggestions`);
    } else {
      logger.info(`ℹ️ Aucun expert préexistant pour cette requête`);
    }

    // Générer les suggestions
    try {
      const suggestions = await generateSuggestions(
        { 
          chat_history: chatHistory,
          existingExperts: hasExistingExperts ? body.existingExperts : undefined 
        },
        llm,
      );

      logger.info(`✅ ${suggestions.length} suggestions générées avec succès`);
      res.status(200).json({ 
        suggestions: suggestions,
        success: true 
      });
    } catch (suggestionError) {
      logger.error(`❌ Erreur lors de la génération des suggestions: ${suggestionError.message}`);
      res.status(500).json({ 
        message: 'Erreur lors de la génération des suggestions',
        success: false,
        error: suggestionError.message
      });
    }
  } catch (err) {
    logger.error(`❌ Erreur globale dans la route /suggestions: ${err.message}`);
    console.error('Erreur détaillée:', err);
    res.status(500).json({ 
      message: 'Une erreur est survenue.',
      success: false,
      error: err.message
    });
  }
});

export default router;
