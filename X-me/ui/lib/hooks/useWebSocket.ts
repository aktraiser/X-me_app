'use client';

import { useEffect, useState } from 'react';
import { debugLog } from './useDebug';

export function useWebSocket() {
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    // Utiliser l'URL de production par défaut si NEXT_PUBLIC_WS_URL n'est pas défini
    const baseWsUrl = process.env.NEXT_PUBLIC_WS_URL || 'wss://xandme-backend.onrender.com';
    
    // Ajouter des paramètres pour mieux identifier la connexion
    const params = new URLSearchParams({
      chatModel: 'o1-mini',
      chatModelProvider: 'openai',
      embeddingModel: 'text-embedding-3-small',
      embeddingModelProvider: 'openai'
    });
    
    const wsUrl = `${baseWsUrl}?${params.toString()}`;
    debugLog('WebSocket', 'URL finale:', wsUrl);
    
    const socket = new WebSocket(wsUrl);

    socket.addEventListener('open', () => {
      debugLog('WebSocket', 'Connexion ouverte');
    });

    socket.addEventListener('error', (error) => {
      debugLog('WebSocket', 'Erreur:', error);
    });

    socket.addEventListener('close', (event) => {
      debugLog('WebSocket', `Connexion fermée: ${event.code} ${event.reason}`);
    });

    socket.addEventListener('message', (event) => {
      debugLog('WebSocket', 'Message reçu:', JSON.parse(event.data));
    });

    setWs(socket);

    return () => {
      socket.close();
    };
  }, []);

  return { ws };
} 