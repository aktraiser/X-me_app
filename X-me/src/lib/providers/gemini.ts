import {
  ChatGoogleGenerativeAI,
  GoogleGenerativeAIEmbeddings,
} from '@langchain/google-genai';
import { getGeminiApiKey } from '../../config';
import logger from '../../utils/logger';
import fs from 'fs';
import { HumanMessage } from '@langchain/core/messages';

/**
 * Ajoute la fonctionnalité d'analyse de fichiers PDF directement avec l'API Gemini
 * @param model Le modèle Gemini à étendre
 * @returns Le modèle avec la méthode geminiFileAnalysis ajoutée
 */
const extendModelWithFileAnalysis = (model: ChatGoogleGenerativeAI) => {
  const originalModel = model;
  
  // Ajouter la méthode geminiFileAnalysis au modèle
  (originalModel as any).geminiFileAnalysis = async ({
    files,
    query,
    temperature = 0.2
  }: {
    files: string[];
    query: string;
    temperature?: number;
  }) => {
    try {
      logger.info(`📄 Analyse de fichiers avec Gemini: ${files.length} fichiers`);
      
      // Charger les fichiers en mémoire
      const fileContents = await Promise.all(
        files.map(async (filePath) => {
          try {
            // Lire le fichier en tant que Buffer
            const fileBuffer = await fs.promises.readFile(filePath);
            // Obtenir le type MIME en fonction de l'extension
            const mimeType = filePath.toLowerCase().endsWith('.pdf') 
              ? 'application/pdf' 
              : 'application/octet-stream';
            
            return {
              data: fileBuffer,
              mimeType
            };
          } catch (error) {
            logger.error(`❌ Erreur lors de la lecture du fichier ${filePath}:`, error);
            throw error;
          }
        })
      );
      
      // Utiliser directement l'API sous-jacente de Google Generative AI
      // plutôt que l'interface LangChain pour contourner les limitations de typage
      const client = (originalModel as any).client;
      if (!client) {
        throw new Error("Impossible d'accéder au client Google GenAI sous-jacent");
      }
      
      // Créer la requête directement pour le client Google GenAI
      const parts = [
        ...fileContents.map(file => ({
          inline_data: {
            mime_type: file.mimeType,
            data: file.data.toString('base64')
          }
        })),
        { text: query }
      ];
      
      // Appeler l'API avec la température modifiée
      const response = await client.generateContent({
        contents: [{ role: 'user', parts: parts }],
        generationConfig: {
          temperature: temperature,
        }
      });
      
      // Vérifier si la réponse contient du texte
      const responseText = response.response?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      if (!responseText) {
          logger.warn("⚠️ La réponse de l'API Gemini ne contient pas de texte.", response.response);
      }
      
      return {
        text: responseText,
        model: originalModel.modelName
      };
    } catch (error) {
      logger.error('❌ Erreur lors de l\'analyse de fichiers avec Gemini:', error);
      // Log plus détaillé si possible
      if (error instanceof Error) {
        logger.error(`  Error Details: Name=${error.name}, Message=${error.message}`);
        if ((error as any).response) {
            logger.error("  API Response Error:", (error as any).response?.data);
        }
      }
      throw error; // Relancer l'erreur pour qu'elle soit gérée en amont
    }
  };
  
  return originalModel;
};

export const loadGeminiChatModels = async () => {
  const geminiApiKey = getGeminiApiKey();

  if (!geminiApiKey) return {};

  try {
    const models = {
      'gemini-2.0-flash': new ChatGoogleGenerativeAI({
        modelName: 'gemini-2.0-flash',
        temperature: 0.5,
        apiKey: geminiApiKey,
      }),
      'gemini-1.5-flash-8b': new ChatGoogleGenerativeAI({
        modelName: 'gemini-1.5-flash-8b',
        temperature: 0.7,
        apiKey: geminiApiKey,
      }),
      'gemini-1.5-pro': new ChatGoogleGenerativeAI({
        modelName: 'gemini-1.5-pro',
        temperature: 0.7,
        apiKey: geminiApiKey,
      }),
    };
    
    // Étendre tous les modèles avec la fonctionnalité d'analyse de fichiers
    const chatModels = {
      'gemini-2.0-flash': {
        displayName: 'gemini-2.0-flash',
        model: extendModelWithFileAnalysis(models['gemini-2.0-flash']),
      },
      'gemini-1.5-flash-8b': {
        displayName: 'Gemini 1.5 Flash 8B',
        model: extendModelWithFileAnalysis(models['gemini-1.5-flash-8b']),
      },
      'gemini-1.5-pro': {
        displayName: 'Gemini 1.5 Pro',
        model: extendModelWithFileAnalysis(models['gemini-1.5-pro']),
      },
    };

    return chatModels;
  } catch (err) {
    logger.error(`Error loading Gemini models: ${err}`);
    return {};
  }
};

export const loadGeminiEmbeddingsModels = async () => {
  const geminiApiKey = getGeminiApiKey();

  if (!geminiApiKey) return {};

  try {
    const embeddingModels = {
      'text-embedding-004': {
        displayName: 'Text Embedding',
        model: new GoogleGenerativeAIEmbeddings({
          apiKey: geminiApiKey,
          modelName: 'text-embedding-004',
        }),
      },
    };

    return embeddingModels;
  } catch (err) {
    logger.error(`Error loading Gemini embeddings model: ${err}`);
    return {};
  }
};
