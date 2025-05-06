'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { startKeepAliveService } from '@/lib/keepAlive';

/**
 * Composant qui démarre le service de ping périodique pour
 * maintenir l'application active sur Render
 */
const KeepAliveProvider = ({ children }: { children: React.ReactNode }) => {
  const { isSignedIn } = useAuth();
  
  useEffect(() => {
    // Désactive temporairement les pings pour éviter les erreurs 404
    const pingDisabled = true;
    
    if (pingDisabled) {
      console.log('KeepAlive: Les pings sont temporairement désactivés');
      return;
    }

    let intervalId: NodeJS.Timeout;

    // Seulement exécuter les pings si l'utilisateur est connecté
    if (isSignedIn) {
      // Fonction pour effectuer le ping
      const performPing = async () => {
        try {
          const response = await fetch('/api/keepalive', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            console.error('Erreur lors du ping KeepAlive:', response.status);
          }
        } catch (error) {
          console.error('Erreur lors du ping KeepAlive:', error);
        }
      };

      // Effectuer un ping immédiatement au chargement
      performPing();

      // Établir l'intervalle pour les pings réguliers
      intervalId = setInterval(performPing, 60000); // Ping toutes les 60 secondes
    }

    // Nettoyer l'intervalle lors du démontage du composant
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isSignedIn]);

  // Ce composant ne rend rien de visible
  return <>{children}</>;
};

export default KeepAliveProvider; 