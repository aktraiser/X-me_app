/**
 * Service de ping périodique pour empêcher Render de mettre le service en veille
 * 
 * Ce fichier configure un service qui envoie périodiquement des requêtes 
 * au serveur et au backend pour les maintenir actifs sur Render
 */

// L'intervalle est défini à 14 minutes (840000 ms) pour éviter la mise en veille après 15 minutes
const PING_INTERVAL_MS = 14 * 60 * 1000;
const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * Envoie une requête ping au serveur backend
 */
const pingBackend = async () => {
  try {
    const response = await fetch(`${API_URL}/ping`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      console.log('[KeepAlive] Ping au backend envoyé avec succès');
    } else {
      console.error('[KeepAlive] Échec du ping au backend:', response.status);
    }
  } catch (error) {
    console.error('[KeepAlive] Erreur lors du ping au backend:', error);
  }
};

/**
 * Envoie une requête ping au serveur frontend
 */
const pingFrontend = async () => {
  try {
    const response = await fetch('/api/ping', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      console.log('[KeepAlive] Ping au frontend envoyé avec succès');
    } else {
      console.error('[KeepAlive] Échec du ping au frontend:', response.status);
    }
  } catch (error) {
    console.error('[KeepAlive] Erreur lors du ping au frontend:', error);
  }
};

/**
 * Démarre le service de ping périodique
 */
export const startKeepAliveService = () => {
  // Exécuter immédiatement les pings au démarrage
  pingBackend();
  pingFrontend();
  
  // Configurer les pings périodiques
  const interval = setInterval(() => {
    pingBackend();
    pingFrontend();
  }, PING_INTERVAL_MS);
  
  // Retourner une fonction pour arrêter le service si nécessaire
  return () => clearInterval(interval);
}; 