import { cleanupExpiredCache } from './firecrawlSearch';

/**
 * Nettoie les caches Firecrawl expirés
 * Cette fonction est destinée à être exécutée périodiquement
 * @returns Un objet indiquant le succès ou l'échec de l'opération
 */
export async function cleanupCaches() {
  try {
    const result = await cleanupExpiredCache();
    
    console.log('✅ Nettoyage des caches effectué avec succès:', result);
    return {
      success: result.success,
      urlsDeleted: result.urlCacheDeleted,
      queriesDeleted: result.queryCacheDeleted,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage des caches:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      timestamp: new Date().toISOString()
    };
  }
} 