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
import crypto from 'crypto';
import { supabase } from '../db/supabase';

const EXCLUDE_TERMS = [
  'watermark',
  'shutterstock',
  'istockphoto',
  'photo by',
  'getty'
];

/**
 * Interface pour la cache d'images
 */
export interface ImageSearchCache {
  id?: string;
  query_text: string;
  query_hash: string;
  images?: any[];
  created_at?: string;
  last_accessed_at?: string;
  access_count?: number;
  expires_at: string;
}

const imageSearchChainPrompt = `
Vous êtes un assistant qui aide à trouver des images pertinentes pour les utilisateurs.
Votre tâche consiste simplement à identifier des catégories d'images potentiellement utiles.

Conversation :
{chat_history}

Question : {query}
Catégories d'images possibles :`;

type ImageSearchChainInput = {
  chat_history: BaseMessage[];
  query: string;
};

const strParser = new StringOutputParser();

/**
 * Récupère une image aléatoire depuis la base de données
 * @param tags Tags optionnels pour filtrer les images 
 * @returns Une image aléatoire ou null si aucune n'est trouvée
 */
async function getRandomImageFromDatabase(
  tags?: string[]
): Promise<any | null> {
  try {
    console.log("🎲 Récupération d'une image aléatoire depuis la base de données");
    
    // Construire la requête de base
    let query = supabase
      .from('random_images')
      .select('*')
      .eq('active', true);
    
    // Ajouter un filtre par tag si fourni
    if (tags && tags.length > 0) {
      // On utilise "overlap" pour vérifier si au moins un des tags fournis est présent dans le tableau tags
      query = query.overlaps('tags', tags);
      console.log(`🏷️ Filtrage par tags: ${tags.join(', ')}`);
    }
    
    // Finaliser la requête
    const { data, error } = await query
      // Problème: PostgREST n'accepte pas 'random()' dans order()
      // Utilisons une autre approche compatible avec Supabase
      .limit(100) // D'abord récupérer un petit ensemble d'images
      .then(result => {
        if (result.error) return result;
        
        // Si pas d'erreur, mélanger les résultats en JavaScript
        const shuffled = result.data ? [...result.data].sort(() => Math.random() - 0.5) : [];
        
        // Prendre la première image du résultat mélangé
        return {
          data: shuffled.length > 0 ? shuffled[0] : null,
          error: null
        };
      });
    
    if (error) {
      console.error("❌ Erreur lors de la récupération d'une image aléatoire:", error);
      
      // Si la table n'existe pas ou autre erreur, on retourne null
      if (error.code === '42P01') { // relation "random_images" does not exist
        console.log("ℹ️ Table 'random_images' introuvable, retour null.");
      }
      
      return null; // Retourne null en cas d'erreur
    }
    
    if (!data) {
      console.log("❓ Aucune image aléatoire trouvée");
      return null; // Retourne null si aucune donnée
    }
    
    console.log("✅ Structure de l'image aléatoire récupérée:", JSON.stringify(data, null, 2));
    
    // Formatage simplifié avec seulement url et tags
    return {
      url: data.url || "https://images.unsplash.com/photo-1600880292089-90a7e086ee0c", // Garder une URL par défaut juste au cas où data.url serait vide
      alt: "Image aléatoire",
      title: "Image aléatoire",
      width: 800,
      height: 600,
      source: "random_database",
      tags: data.tags || [],
      img_src: data.url || "https://images.unsplash.com/photo-1600880292089-90a7e086ee0c" // Garder une URL par défaut juste au cas où data.url serait vide
    };
  } catch (error) {
    console.error("❌ Erreur lors de la récupération d'une image aléatoire:", error);
    return null; // Retourne null en cas d'exception
  }
}

const createImageSearchChain = (llm: BaseChatModel) => {
  return RunnableSequence.from([
    RunnableMap.from({
      chat_history: (input: ImageSearchChainInput) => {
        return formatChatHistoryAsString(input.chat_history);
      },
      query: (input: ImageSearchChainInput) => {
        return input.query;
      },
    }),
    // Ignorer l'analyse LLM et passer directement à la récupération d'image aléatoire
    RunnableLambda.from(async (input: any) => {
      try {
        console.log('🔍 Récupération d\'image aléatoire, ignorant le contexte de la requête');
        
        // Utiliser des tags génériques sans analyser la requête
        const tags = extractCategories("");
        console.log('🏷️ Tags génériques utilisés:', tags);
        
        // Récupérer une image aléatoire de la base de données
        const randomImage = await getRandomImageFromDatabase(tags);
        
        // Si une image est trouvée, la retourner dans un tableau
        if (randomImage) {
          console.log('✅ Image retournée avec img_src:', randomImage.img_src || randomImage.url);
          return [randomImage];
        }
        
        // Si aucune image n'est trouvée, utiliser des images par défaut
        console.log('⚠️ Aucune image aléatoire trouvée, utilisation des images par défaut.');
        return getDefaultImages();
      } catch (error) {
        console.error('❌ Erreur lors de la recherche d\'image:', error);
        return getDefaultImages();
      }
    }),
  ]);
};

/**
 * Extrait des catégories potentielles à partir du texte d'entrée
 * et les convertit en tags pour la recherche d'images
 * (Simplifié pour toujours retourner des tags génériques)
 */
function extractCategories(input: string): string[] {
  // Retourner toujours des tags génériques sans analyser le contexte
  return ['business', 'professional', 'team', 'technology', 'digital'];
}

const handleImageSearch = async (
  input: ImageSearchChainInput,
  llm: BaseChatModel,
) => {
  try {
    // Vérifier d'abord si nous avons des résultats en cache
    const cachedImages = await getImageSearchFromCache(input.query);
    if (cachedImages && cachedImages.length > 0) {
      console.log('✅ Utilisation des résultats du cache d\'images');
      return cachedImages;
    }
    
    // Si rien en cache, effectuer une nouvelle recherche
    console.log('🔍 Pas de cache disponible, exécution de la recherche...');
    const imageSearchChain = createImageSearchChain(llm);
    const results = await imageSearchChain.invoke(input);
    
    // Sauvegarder les résultats dans le cache
    if (results && results.length > 0) {
      await saveImageSearchCache(input.query, results);
    }
    
    return results;
  } catch (error) {
    console.error('❌ Erreur dans handleImageSearch:', error);
    return getDefaultImages();
  }
};

/**
 * Nettoie les entrées de cache d'images expirées
 * @returns Un objet avec les statistiques de nettoyage
 */
export async function cleanupExpiredImageCache(): Promise<{ 
  imagesDeleted: number,
  success: boolean
}> {
  try {
    // Supprimer les entrées expirées de image_search_cache
    const { error, count } = await supabase
      .from('image_search_cache')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .select('count');
    
    if (error) {
      console.error('Erreur lors du nettoyage du cache d\'images:', error);
      throw error;
    }
    
    return {
      imagesDeleted: count || 0,
      success: true
    };
  } catch (error) {
    console.error('Erreur lors du nettoyage du cache d\'images:', error);
    return {
      imagesDeleted: 0,
      success: false
    };
  }
}

/**
 * Sauvegarde les résultats de recherche d'images dans le cache
 * @param query Le texte de la requête originale
 * @param images Les images trouvées
 * @param expirationDays Nombre de jours avant expiration (défaut: 7)
 * @returns L'entrée de cache créée ou null en cas d'erreur
 */
export async function saveImageSearchCache(
  query: string,
  images: any[],
  expirationDays: number = 7
): Promise<ImageSearchCache | null> {
  try {
    // Générer un hash pour la requête
    const queryHash = crypto
      .createHash('md5')
      .update(query.toLowerCase().trim())
      .digest('hex');
    
    // Calculer la date d'expiration
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expirationDays);
    
    // Préparer l'entrée de cache
    const cacheEntry: ImageSearchCache = {
      query_text: query,
      query_hash: queryHash,
      images: images,
      created_at: new Date().toISOString(),
      last_accessed_at: new Date().toISOString(),
      access_count: 1,
      expires_at: expiresAt.toISOString()
    };
    
    // Sauvegarder dans la base de données
    const { data, error } = await supabase
      .from('image_search_cache')
      .insert(cacheEntry)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Erreur lors de la sauvegarde du cache d\'images:', error);
      return null;
    }
    
    console.log('✅ Cache d\'images sauvegardé avec succès:', data.id);
    return data;
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde du cache d\'images:', error);
    return null;
  }
}

/**
 * Cherche des images en cache pour une requête donnée
 * @param query Le texte de la requête
 * @returns Les images trouvées en cache ou null si non trouvées
 */
export async function getImageSearchFromCache(query: string): Promise<any[] | null> {
  try {
    // Générer un hash pour la requête
    const queryHash = crypto
      .createHash('md5')
      .update(query.toLowerCase().trim())
      .digest('hex');
    
    // Rechercher dans le cache
    const { data, error } = await supabase
      .from('image_search_cache')
      .select('*')
      .eq('query_hash', queryHash)
      .gt('expires_at', new Date().toISOString())
      .single();
    
    if (error || !data) {
      console.log('ℹ️ Aucun résultat en cache pour cette requête');
      return null;
    }
    
    // Mettre à jour les statistiques d'accès
    await supabase
      .from('image_search_cache')
      .update({
        last_accessed_at: new Date().toISOString(),
        access_count: (data.access_count || 0) + 1
      })
      .eq('id', data.id);
    
    console.log('✅ Résultats trouvés en cache:', data.images?.length || 0, 'images');
    return data.images || [];
  } catch (error) {
    console.error('❌ Erreur lors de la recherche dans le cache d\'images:', error);
    return null;
  }
}

/**
 * Fournit des images par défaut lorsque la recherche échoue
 * @returns Un tableau d'images par défaut
 */
function getDefaultImages(): any[] {
  console.log('🖼️ Utilisation d\'images par défaut');
  return [
    {
      url: "https://images.unsplash.com/photo-1600880292089-90a7e086ee0c",
      alt: "Image professionnelle par défaut",
      title: "Image par défaut",
      width: 800,
      height: 600,
      source: "default",
      tags: ["business", "professional", "default"],
      img_src: "https://images.unsplash.com/photo-1600880292089-90a7e086ee0c"
    }
  ];
}

export default handleImageSearch;