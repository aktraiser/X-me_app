import {
  RunnableSequence,
  RunnableMap,
  RunnableLambda,
} from '@langchain/core/runnables';
import { PromptTemplate } from '@langchain/core/prompts';
import formatChatHistoryAsString from '../utils/formatHistory';
import { BaseMessage } from '@langchain/core/messages';
import { StringOutputParser } from '@langchain/core/output_parsers';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { getFirecrawlApiKey } from '../config';
import axios from 'axios';

const VideoSearchChainPrompt = `
Vous allez recevoir une conversation et une question de suivi. Vous devez reformuler la question de suivi pour qu'elle soit une question autonome qui peut être utilisée pour rechercher des vidéos YouTube.
Assurez-vous que la question reformulée est en accord avec la conversation et pertinente pour le contexte.

Exemples:
1. Question de suivi: Comment fonctionne une voiture?
Reformulation: Comment fonctionne une voiture

2. Question de suivi: Quelle est la théorie de la relativité?
Reformulation: Théorie de la relativité explication

3. Question de suivi: Comment fonctionne un climatiseur?
Reformulation: Fonctionnement d'un climatiseur

Conversation:
{chat_history}

Question de suivi: {query}
Question reformulée:
`;

type VideoSearchChainInput = {
  chat_history: BaseMessage[];
  query: string;
};

interface VideoSearchResult {
  img_src: string;
  url: string;
  title: string;
  iframe_src: string;
}

const strParser = new StringOutputParser();

// Fonction pour rechercher des vidéos avec Firecrawl
async function searchVideosWithFirecrawl(query: string) {
  try {
    const apiKey = getFirecrawlApiKey();
    if (!apiKey) {
      console.error("❌ Clé API Firecrawl manquante dans config.toml");
      return [];
    }

    console.log("🔥 Utilisation de Firecrawl pour la recherche vidéo:", query);
    
    // Configuration de la recherche Firecrawl optimisée pour les vidéos YouTube
    const requestBody = {
      query: `${query} site:youtube.com vidéo`,
      limit: 5,
      lang: 'fr',
      country: 'fr',
      timeout: 30000, // 30 secondes max
      scrapeOptions: {
        formats: ["markdown"]
      }
    };
    
    console.log("📡 Envoi de la requête à Firecrawl:", JSON.stringify(requestBody));
    
    // Appel à l'API Firecrawl Search
    const response = await axios.post(
      'https://api.firecrawl.dev/v1/search',
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );

    if (!response.data.success) {
      console.error('❌ Erreur lors de la recherche Firecrawl:', response.data);
      throw new Error(`Échec de la recherche Firecrawl: ${JSON.stringify(response.data)}`);
    }
    
    console.log(`✅ Recherche Firecrawl terminée, ${response.data.data?.length || 0} résultats`);
    
    // Transformer les résultats Firecrawl en format vidéo
    if (response.data.data && Array.isArray(response.data.data)) {
      return response.data.data
        .filter(item => item.url && item.url.includes('youtube.com'))
        .map(item => ({
          url: item.url,
          title: item.title || 'Vidéo sans titre',
          thumbnail: `https://img.youtube.com/vi/${extractVideoId(item.url)}/hqdefault.jpg`,
          iframe_src: `https://www.youtube.com/embed/${extractVideoId(item.url)}`
        }));
    }
    
    return [];
  } catch (error) {
    console.error("❌ Erreur lors de la recherche avec Firecrawl:", error);
    console.error("❌ Détails de l'erreur:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      headers: error.response?.headers
    });
    return [];
  }
}

// Fonction utilitaire pour extraire l'ID vidéo YouTube
function extractVideoId(url: string): string {
  if (!url) return '';
  
  try {
    if (url.includes('youtube.com/watch')) {
      const urlObj = new URL(url);
      return urlObj.searchParams.get('v') || '';
    } else if (url.includes('youtu.be/')) {
      const match = url.match(/youtu\.be\/([^?&#]*)/);
      return match && match[1] ? match[1] : '';
    } else if (url.includes('youtube.com/embed/')) {
      const match = url.match(/youtube\.com\/embed\/([^?&#]*)/);
      return match && match[1] ? match[1] : '';
    }
  } catch (e) {
    console.error('❌ Erreur lors de l\'extraction de l\'ID YouTube:', e);
  }
  
  return '';
}

const createVideoSearchChain = (llm: BaseChatModel) => {
  return RunnableSequence.from([
    RunnableMap.from({
      chat_history: (input: VideoSearchChainInput) => {
        return formatChatHistoryAsString(input.chat_history);
      },
      query: (input: VideoSearchChainInput) => {
        return input.query;
      },
    }),
    PromptTemplate.fromTemplate(VideoSearchChainPrompt),
    llm,
    strParser,
    RunnableLambda.from(async (input: string) => {
      input = input.replace(/<think>.*?<\/think>/g, '');
      console.log("🔍 Recherche de vidéos pour:", input);

      // Utiliser Firecrawl pour la recherche
      const searchResults = await searchVideosWithFirecrawl(input);
      console.log(`✅ ${searchResults.length} vidéos trouvées via Firecrawl`);

      // Transformer les résultats au format attendu
      const videos: VideoSearchResult[] = searchResults.map((result: any) => {
        const videoId = extractVideoId(result.url);
        return {
          img_src: result.thumbnail || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          url: result.url,
          title: result.title || 'Vidéo sans titre',
          iframe_src: result.iframe_src || `https://www.youtube.com/embed/${videoId}`
        };
      }).filter((v: VideoSearchResult) => v.url && v.title);

      return videos.slice(0, 10);
    }),
  ]);
};

const handleVideoSearch = (
  input: VideoSearchChainInput,
  llm: BaseChatModel,
) => {
  console.log("🔎 Démarrage de la recherche vidéo avec Firecrawl");
  const VideoSearchChain = createVideoSearchChain(llm);
  return VideoSearchChain.invoke(input);
};

export default handleVideoSearch;

