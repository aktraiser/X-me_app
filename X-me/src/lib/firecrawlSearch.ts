import axios from 'axios';
import crypto from 'crypto';
import { getFirecrawlApiKey } from '../config';
import { supabase } from '../db/supabase';

export interface FirecrawlSearchOptions {
  language?: string;
  limit?: number;
  maxDepth?: number;
  timeLimit?: number;
  maxUrls?: number;
  useCache?: boolean; // Nouvelle option pour désactiver le cache si nécessaire
  cacheExpiration?: number; // Durée de validité du cache en jours
  country?: string; // Pays pour la recherche
  scrapeContent?: boolean; // Option pour activer/désactiver le scraping complet
}

export interface SearchResult {
  title: string;
  url: string;
  content: string;
  favicon?: string;
  img_src?: string;
  description?: string; // Parfois utilisé au lieu de content
  icon?: string; // Parfois utilisé au lieu de favicon
  source?: string; // Pour suivre la provenance du résultat
}

/**
 * Interface pour la cache d'URL Firecrawl
 */
export interface FirecrawlUrlCache {
  id?: string;
  url: string;
  title?: string;
  content?: string;
  favicon?: string;
  metadata?: any;
  created_at?: string;
  last_crawled_at?: string;
  crawl_count?: number;
  expires_at?: string;
}

/**
 * Interface pour la cache de requêtes Firecrawl
 */
export interface FirecrawlQueryCache {
  id?: string;
  query_text: string;
  query_hash?: string;
  search_results?: SearchResult[];
  final_analysis?: string;
  created_at?: string;
  last_accessed_at?: string;
  access_count?: number;
  expires_at?: string;
}

/**
 * Vérifie si une URL est valide
 * @param url L'URL à vérifier
 * @returns true si l'URL est valide, false sinon
 */
function isValidUrl(url: string): boolean {
  try {
    // Vérifier si l'URL est bien formée
    const parsedUrl = new URL(url);
    // Vérifier si le protocole est http ou https
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  } catch (e) {
    return false;
  }
}

/**
 * Génère un hash MD5 pour une chaîne de caractères
 * @param text Texte à hacher
 * @returns Hash MD5 du texte
 */
function generateMD5Hash(text: string): string {
  return crypto.createHash('md5').update(text).digest('hex');
}

/**
 * Sauvegarde ou met à jour les données d'une URL dans le cache
 * @param url URL de la page
 * @param result Résultat du crawl
 * @param expirationDays Nombre de jours avant expiration du cache
 * @returns L'entrée du cache mise à jour
 */
async function saveUrlToCache(url: string, result: SearchResult, expirationDays = 14): Promise<FirecrawlUrlCache | null> {
  if (!url || !isValidUrl(url)) return null;

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expirationDays);

  try {
    // Vérifier si l'URL existe déjà dans le cache
    const { data: existingData, error: existingError } = await supabase
      .from('firecrawl_url_cache')
      .select('*')
      .eq('url', url)
      .maybeSingle();

    if (existingError) {
      console.error('Erreur lors de la vérification du cache d\'URL:', existingError);
      return null;
    }

    if (existingData) {
      // Mettre à jour l'entrée existante
      const { data: updatedData, error: updateError } = await supabase
        .from('firecrawl_url_cache')
        .update({
          title: result.title || existingData.title,
          content: result.content || existingData.content,
          favicon: result.favicon || result.icon || existingData.favicon,
          metadata: { ...existingData.metadata, updated: new Date().toISOString() },
          last_crawled_at: new Date().toISOString(),
          crawl_count: existingData.crawl_count + 1,
          expires_at: expiresAt.toISOString()
        })
        .eq('id', existingData.id)
        .select('*')
        .single();

      if (updateError) {
        console.error('Erreur lors de la mise à jour du cache d\'URL:', updateError);
        return null;
      }

      return updatedData;
    } else {
      // Créer une nouvelle entrée
      const { data: newData, error: insertError } = await supabase
        .from('firecrawl_url_cache')
        .insert({
          url,
          title: result.title || 'Sans titre',
          content: result.content || '',
          favicon: result.favicon || result.icon,
          metadata: { source: 'firecrawl' },
          expires_at: expiresAt.toISOString()
        })
        .select('*')
        .single();

      if (insertError) {
        console.error('Erreur lors de l\'ajout au cache d\'URL:', insertError);
        return null;
      }

      return newData;
    }
  } catch (error) {
    console.error('Erreur lors de la sauvegarde dans le cache d\'URL:', error);
    return null;
  }
}

/**
 * Récupère une URL du cache si elle existe
 * @param url URL à rechercher
 * @returns Données de l'URL depuis le cache ou null si non trouvée
 */
async function getUrlFromCache(url: string): Promise<FirecrawlUrlCache | null> {
  if (!url || !isValidUrl(url)) return null;

  try {
    const { data, error } = await supabase
      .from('firecrawl_url_cache')
      .select('*')
      .eq('url', url)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (error) {
      console.error('Erreur lors de la récupération du cache d\'URL:', error);
      return null;
    }

    if (data) {
      // Mettre à jour le compteur d'accès
      await supabase
        .from('firecrawl_url_cache')
        .update({
          last_crawled_at: new Date().toISOString(),
          crawl_count: data.crawl_count + 1
        })
        .eq('id', data.id);

      return data;
    }

    return null;
  } catch (error) {
    console.error('Erreur lors de la récupération du cache d\'URL:', error);
    return null;
  }
}

/**
 * Sauvegarde ou met à jour les résultats d'une requête dans le cache
 * @param query Requête de recherche
 * @param results Résultats de la recherche
 * @param finalAnalysis Analyse finale produite par Firecrawl
 * @param expirationDays Nombre de jours avant expiration du cache
 * @returns L'entrée du cache mise à jour
 */
async function saveQueryToCache(
  query: string, 
  results: SearchResult[], 
  finalAnalysis: string = '', 
  expirationDays = 7
): Promise<FirecrawlQueryCache | null> {
  if (!query) return null;

  const queryHash = generateMD5Hash(query.toLowerCase().trim());
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expirationDays);

  try {
    // Vérifier si la requête existe déjà dans le cache
    const { data: existingData, error: existingError } = await supabase
      .from('firecrawl_query_cache')
      .select('*')
      .eq('query_hash', queryHash)
      .maybeSingle();

    if (existingError) {
      console.error('Erreur lors de la vérification du cache de requête:', existingError);
      return null;
    }

    // Générer l'embedding sera fait par un job séparé si nécessaire
    // Pour l'instant, nous stockons juste les données brutes

    if (existingData) {
      // Mettre à jour l'entrée existante
      const { data: updatedData, error: updateError } = await supabase
        .from('firecrawl_query_cache')
        .update({
          search_results: results,
          final_analysis: finalAnalysis || existingData.final_analysis,
          last_accessed_at: new Date().toISOString(),
          access_count: existingData.access_count + 1,
          expires_at: expiresAt.toISOString()
        })
        .eq('id', existingData.id)
        .select('*')
        .single();

      if (updateError) {
        console.error('Erreur lors de la mise à jour du cache de requête:', updateError);
        return null;
      }

      return updatedData;
    } else {
      // Créer une nouvelle entrée
      const { data: newData, error: insertError } = await supabase
        .from('firecrawl_query_cache')
        .insert({
          query_text: query,
          query_hash: queryHash,
          search_results: results,
          final_analysis: finalAnalysis,
          expires_at: expiresAt.toISOString()
        })
        .select('*')
        .single();

      if (insertError) {
        console.error('Erreur lors de l\'ajout au cache de requête:', insertError);
        return null;
      }

      return newData;
    }
  } catch (error) {
    console.error('Erreur lors de la sauvegarde dans le cache de requête:', error);
    return null;
  }
}

/**
 * Récupère les résultats d'une requête depuis le cache
 * @param query Requête à rechercher
 * @returns Données de la requête depuis le cache ou null si non trouvée
 */
async function getQueryFromCache(query: string): Promise<FirecrawlQueryCache | null> {
  if (!query) return null;

  const queryHash = generateMD5Hash(query.toLowerCase().trim());

  try {
    const { data, error } = await supabase
      .from('firecrawl_query_cache')
      .select('*')
      .eq('query_hash', queryHash)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (error) {
      console.error('Erreur lors de la récupération du cache de requête:', error);
      return null;
    }

    if (data) {
      // Mettre à jour le compteur d'accès
      await supabase
        .from('firecrawl_query_cache')
        .update({
          last_accessed_at: new Date().toISOString(),
          access_count: data.access_count + 1
        })
        .eq('id', data.id);

      return data;
    }

    return null;
  } catch (error) {
    console.error('Erreur lors de la récupération du cache de requête:', error);
    return null;
  }
}

/**
 * Recherche des requêtes similaires dans le cache
 * @param query Requête à comparer
 * @param threshold Seuil de similarité (0-1)
 * @param limit Nombre maximal de résultats à retourner
 * @returns Liste des entrées de cache similaires
 */
async function findSimilarQueries(query: string, threshold = 0.75, limit = 1): Promise<FirecrawlQueryCache[]> {
  // Cette fonction nécessite que les embeddings soient déjà générés
  // Pour l'instant, nous implémentons une version simple basée sur les mots-clés
  
  if (!query) return [];
  
  const keywords = query.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3);
  
  if (keywords.length === 0) return [];
  
  try {
    // Recherche basée sur les mots-clés
    const { data, error } = await supabase
      .from('firecrawl_query_cache')
      .select('*')
      .gt('expires_at', new Date().toISOString())
      .order('access_count', { ascending: false })
      .limit(20);
    
    if (error || !data) {
      console.error('Erreur lors de la recherche de requêtes similaires:', error);
      return [];
    }
    
    // Filtre manuel par similarité de mots-clés
    const similar = data.filter(item => {
      const itemKeywords = item.query_text.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 3);
      
      const commonKeywords = keywords.filter(word => itemKeywords.includes(word));
      const similarity = commonKeywords.length / Math.max(keywords.length, itemKeywords.length);
      
      return similarity >= threshold;
    });
    
    return similar.slice(0, limit);
  } catch (error) {
    console.error('Erreur lors de la recherche de requêtes similaires:', error);
    return [];
  }
}

// Variable globale pour stocker les activités de recherche en cours
let _currentActivities = [];

/**
 * Effectue une recherche web en utilisant l'API Firecrawl avec cache
 * @param query - La requête de recherche
 * @param opts - Options pour la recherche
 * @returns Résultats de recherche et suggestions
 */
export async function searchFirecrawl(
  query: string,
  opts: FirecrawlSearchOptions = {}
) {
  // Réactiver le cache Supabase pour une performance optimale
  const useCache = opts.useCache !== false; // Utiliser le cache par défaut sauf si explicitement désactivé
  const cacheExpiration = opts.cacheExpiration || 7; // Par défaut, 7 jours
  
  // Réinitialiser les activités à chaque nouvelle recherche
  _currentActivities = [];
  
  console.error('🔍 Démarrage de la recherche Firecrawl' + (useCache ? ' - Cache activé' : ' - Cache désactivé'));
  console.error(`🔍 Query: "${query.substring(0, 50)}${query.length > 50 ? '...' : ''}"`);

  // Vérifier d'abord dans le cache
  if (useCache) {
    // 1. Chercher la requête exacte dans le cache
    const cachedQuery = await getQueryFromCache(query);
    if (cachedQuery) {
      console.error('✅ Résultat trouvé dans le cache de requêtes');
      return {
        results: cachedQuery.search_results,
        finalAnalysis: cachedQuery.final_analysis || '',
        suggestions: [],
        fromCache: true,
        activities: _currentActivities
      };
    }
    
    // 2. Chercher des requêtes similaires
    const similarQueries = await findSimilarQueries(query);
    if (similarQueries.length > 0) {
      console.error('✅ Résultat similaire trouvé dans le cache de requêtes');
      return {
        results: similarQueries[0].search_results,
        finalAnalysis: similarQueries[0].final_analysis || '',
        suggestions: [],
        fromCache: true,
        similarQuery: similarQueries[0].query_text,
        activities: _currentActivities
      };
    }
  }

  // Si pas de résultat en cache, faire la recherche via l'API
  const apiKey = getFirecrawlApiKey();
  
  try {
    // Configuration de la requête pour l'endpoint /search (plus simple que deep-research)
    const requestBody = {
      query,
      limit: opts.limit || 5,
      lang: opts.language || 'fr',
      country: opts.country || 'fr',
      timeout: opts.timeLimit ? opts.timeLimit * 1000 : 60000, // Conversion en millisecondes
      scrapeOptions: {}
    };
    
    // Activer le scraping complet des pages si demandé (par défaut: activé)
    if (opts.scrapeContent !== false) {
      requestBody.scrapeOptions = {
        formats: ["markdown"]
      };
    }
    
    // Simuler les activités pour la compatibilité avec l'UI
    _currentActivities.push({
      type: 'search',
      status: 'in_progress',
      message: `Recherche: "${query}"`,
      timestamp: new Date().toISOString(),
      depth: 1,
      maxDepth: 1
    });
    
    console.error('📤 Envoi de la requête à Firecrawl Search:', JSON.stringify(requestBody, null, 2).substring(0, 200) + '...');
    
    // Appel direct à l'API search
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
      throw new Error('Échec de la recherche Firecrawl');
    }

    // Marquer l'activité de recherche comme terminée
    _currentActivities = _currentActivities.map(activity => 
      activity.type === 'search' ? {...activity, status: 'completed'} : activity
    );
    
    // Ajouter une activité d'extraction
    _currentActivities.push({
      type: 'extract',
      status: 'completed',
      message: `Extraction du contenu des pages`,
      timestamp: new Date().toISOString(),
      depth: 1,
      maxDepth: 1
    });
    
    console.error('✅ Recherche Firecrawl terminée avec succès');
    
    // Traitement des résultats
    const results: SearchResult[] = [];
    
    if (response.data.data && Array.isArray(response.data.data)) {
      response.data.data.forEach(item => {
        if (item.url && isValidUrl(item.url)) {
          const result = {
            title: item.title || 'Sans titre',
            url: item.url,
            content: item.markdown || item.description || '',
            description: item.description || '',
            favicon: `https://s2.googleusercontent.com/s2/favicons?domain_url=${item.url}`,
            source: 'firecrawl_search'
          };
          
          results.push(result);
          
          // Mettre en cache l'URL
          if (useCache) {
            saveUrlToCache(item.url, result, cacheExpiration);
          }
        }
      });
    }
    
    // Si les résultats ne contiennent pas d'URL valides, signaler une erreur
    if (results.length === 0) {
      console.error('⚠️ Aucun résultat valide trouvé');
      throw new Error('Aucun résultat valide trouvé dans la recherche Firecrawl');
    }
    
    // Ajouter une activité de synthèse
    _currentActivities.push({
      type: 'synthesize',
      status: 'completed',
      message: `Synthèse des résultats (${results.length} sources)`,
      timestamp: new Date().toISOString(),
      depth: 1,
      maxDepth: 1
    });
    
    // Créer une analyse simple (l'endpoint /search ne fournit pas d'analyse)
    const finalAnalysis = `Résultats de recherche pour "${query}". ${results.length} sources trouvées.`;
    
    // Mettre en cache la requête
    if (useCache) {
      saveQueryToCache(query, results, finalAnalysis, cacheExpiration);
    }
    
    return {
      results,
      suggestions: [],
      finalAnalysis,
      activities: _currentActivities
    };
    
  } catch (error) {
    console.error('❌ Erreur lors de la recherche Firecrawl:', error);
    if (axios.isAxiosError(error)) {
      console.error('❌ Détails de l\'erreur Axios:');
      console.error(`  Status: ${error.response?.status}`);
      console.error(`  Message: ${error.message}`);
      console.error(`  Données: ${JSON.stringify(error.response?.data || {})}`);
    }
    
    // Essayer de trouver des requêtes similaires comme solution de secours
    if (useCache) {
      const similarQueries = await findSimilarQueries(query, 0.5); // Seuil encore plus bas en cas d'erreur
      if (similarQueries.length > 0) {
        console.error('✅ Solution de secours après erreur: résultat similaire trouvé dans le cache');
        return {
          results: similarQueries[0].search_results,
          finalAnalysis: similarQueries[0].final_analysis || '',
          suggestions: [],
          fromCache: true,
          similarQuery: similarQueries[0].query_text,
          isFallback: true,
          activities: _currentActivities
        };
      }
    }
    
    // Si on n'a pas obtenu de résultats complets, signaler une erreur
    console.error('⚠️ Recherche non terminée ou pas de résultats');
    throw new Error('La recherche Firecrawl n\'a pas pu être complétée');
  }
}

/**
 * Nettoie les entrées de cache expirées
 * @returns Un objet avec les statistiques de nettoyage
 */
export async function cleanupExpiredCache(): Promise<{ 
  urlCacheDeleted: number, 
  queryCacheDeleted: number,
  success: boolean
}> {
  try {
    // Utiliser le client supabase déjà importé du module db/supabase
    
    // Supprimer les entrées expirées de firecrawl_url_cache
    const { error: urlError, count: urlCount } = await supabase
      .from('firecrawl_url_cache')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .select('count');
    
    if (urlError) {
      console.error('Erreur lors du nettoyage de la cache URL:', urlError);
      throw urlError;
    }
    
    // Supprimer les entrées expirées de firecrawl_query_cache
    const { error: queryError, count: queryCount } = await supabase
      .from('firecrawl_query_cache')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .select('count');
    
    if (queryError) {
      console.error('Erreur lors du nettoyage de la cache de requêtes:', queryError);
      throw queryError;
    }
    
    return {
      urlCacheDeleted: urlCount || 0,
      queryCacheDeleted: queryCount || 0,
      success: true
    };
  } catch (error) {
    console.error('Erreur lors du nettoyage des caches:', error);
    return {
      urlCacheDeleted: 0,
      queryCacheDeleted: 0,
      success: false
    };
  }
}

/**
 * Génère des résultats de recherche simulés pour les cas où l'API échoue
 * @param query Requête de recherche
 * @returns Résultats simulés avec structure similaire à l'API
 */
export function generateSimulatedResults(query: string) {
  // Extraire des mots clés pour personnaliser les résultats
  const keywords = query.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
  
  // Ajouter un paramètre aléatoire pour éviter le cache des images
  const randomParam = `time=${Date.now()}`;
  
  // Créer des domaines variés pour les résultats
  const domains = [
    'business-insights.com',
    'tech-innovations.fr',
    'digital-workplace.io',
    'modern-strategies.net',
    'professional-resources.org',
    'smart-solutions.io',
    'corporate-hub.net'
  ];
  
  // Randomiser l'ordre des résultats
  const shuffledDomains = [...domains].sort(() => 0.5 - Math.random());
  
  // Créer une variété de titres basés sur la requête
  const titlePrefixes = [
    'Guide complet sur', 
    'Comprendre', 
    'L\'essentiel à savoir sur', 
    'Analyse détaillée:', 
    'Tendances actuelles:', 
    'Comment optimiser',
    'Stratégies pour'
  ];
  
  // Créer une variété de contenus
  const contentPrefixes = [
    'Dans cet article, nous explorons',
    'Les recherches montrent que',
    'Les experts recommandent',
    'Une étude récente indique que',
    'Les meilleures pratiques incluent',
    'Pour réussir dans ce domaine, il est important de'
  ];
  
  // Générer des résultats variés
  const results = shuffledDomains.slice(0, 5).map((domain, index) => {
    // Sélectionner aléatoirement des éléments pour ce résultat
    const titlePrefix = titlePrefixes[Math.floor(Math.random() * titlePrefixes.length)];
    const contentPrefix = contentPrefixes[Math.floor(Math.random() * contentPrefixes.length)];
    
    // Utiliser des mots-clés de la requête pour personnaliser
    const keywordsForTitle = keywords.length >= 2 
      ? keywords.slice(0, 2).join(' ') 
      : (keywords[0] || 'ce sujet');
    
    // Générer un contenu plus riche
    const contentKeywords = keywords.length > 0 
      ? keywords.join(', ') 
      : 'ce sujet important';
    
    // Créer un paragraphe de contenu
    const content = `${contentPrefix} ${contentKeywords}. ${
      index % 2 === 0 
        ? `Les points clés à considérer sont la planification stratégique, l'analyse des tendances et l'adaptation aux changements du marché.` 
        : `Il est recommandé d'adopter une approche holistique qui intègre innovation, durabilité et efficacité opérationnelle.`
    } ${
      index % 3 === 0 
        ? `De nombreuses organisations ont constaté des améliorations significatives après avoir implémenté ces méthodes.` 
        : `Les études de cas démontrent l'efficacité de ces stratégies dans divers secteurs d'activité.`
    }`;
    
    // Générer une URL unique
    const path = keywords.length > 0 
      ? keywords.slice(0, 2).join('-') 
      : 'information';
    
    return {
      title: `${titlePrefix} ${keywordsForTitle}`,
      url: `https://${domain}/${path}-${index + 1}`,
      content: content,
      favicon: `https://s2.googleusercontent.com/s2/favicons?domain_url=https://${domain}`,
      img_src: index % 3 === 0 ? `https://source.unsplash.com/featured/?${keywords.slice(0, 2).join(',')}&${randomParam}` : undefined,
      description: content.substring(0, 160) + '...',
      source: 'simulated'
    };
  });
  
  // Créer un résultat final similaire à celui de l'API
  return {
    results,
    suggestions: [],
    finalAnalysis: `Résultats simulés générés pour "${query}"`,
    fromCache: false,
    activities: [
      {
        type: 'search',
        status: 'completed',
        message: `Recherche simulée: "${query}"`,
        timestamp: new Date().toISOString(),
        depth: 1,
        maxDepth: 1
      }
    ]
  };
} 