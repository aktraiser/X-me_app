'use client';

import { useEffect } from 'react';
import { startKeepAliveService } from '@/lib/keepAlive';

/**
 * Composant qui démarre le service de ping périodique pour
 * maintenir l'application active sur Render
 */
const KeepAliveProvider = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    // Ne démarrer le service que dans le navigateur, pas lors du SSR
    if (typeof window !== 'undefined') {
      console.log('[KeepAlive] Démarrage du service de ping périodique');
      const stopKeepAlive = startKeepAliveService();
      
      // Nettoyer à la déconnexion du composant
      return () => {
        console.log('[KeepAlive] Arrêt du service de ping périodique');
        stopKeepAlive();
      };
    }
  }, []);

  // Ce composant ne rend rien de visible
  return <>{children}</>;
};

export default KeepAliveProvider; 