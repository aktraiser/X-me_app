'use client';

/**
 * Utilitaire de logging conditionnel pour l'application
 * Sera utilisé uniquement si NEXT_PUBLIC_DEBUG est défini à 'true'
 */

// Vérifie si le mode debug est activé
const isDebugEnabled = typeof process !== 'undefined' && process.env.NEXT_PUBLIC_DEBUG === 'true';

/**
 * Fonction de logging conditionnelle
 * @param component Le composant ou module d'où provient le log
 * @param message Le message à logger
 * @param data Données optionnelles à inclure dans le log
 */
export const debugLog = (component: string, message: string, data?: any) => {
  if (!isDebugEnabled) return;
  
  if (data) {
    console.log(`[DEBUG ${component}] ${message}`, data);
  } else {
    console.log(`[DEBUG ${component}] ${message}`);
  }
};

/**
 * Fonction d'erreur conditionnelle
 * @param component Le composant ou module d'où provient l'erreur
 * @param message Le message d'erreur
 * @param error L'erreur optionnelle à inclure
 */
export const debugError = (component: string, message: string, error?: any) => {
  if (!isDebugEnabled) return;
  
  if (error) {
    console.error(`[DEBUG ERROR ${component}] ${message}`, error);
  } else {
    console.error(`[DEBUG ERROR ${component}] ${message}`);
  }
};

/**
 * Vérifie si le mode debug est activé
 * @returns true si le mode debug est activé
 */
export const isDebugMode = () => isDebugEnabled; 