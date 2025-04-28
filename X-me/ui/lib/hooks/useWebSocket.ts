import { useEffect, useState } from 'react';

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
    console.log("[DEBUG WebSocket] URL finale:", wsUrl);
    
    const socket = new WebSocket(wsUrl);

    socket.addEventListener('open', () => {
      console.log('[DEBUG WebSocket] Connexion ouverte');
    });

    socket.addEventListener('error', (error) => {
      console.error('[DEBUG WebSocket] Erreur:', error);
    });

    socket.addEventListener('close', (event) => {
      console.log(`[DEBUG WebSocket] Connexion fermée: ${event.code} ${event.reason}`);
    });

    socket.addEventListener('message', (event) => {
      console.log('[DEBUG WebSocket] Message reçu:', JSON.parse(event.data));
    });

    setWs(socket);

    return () => {
      socket.close();
    };
  }, []);

  return { ws };
} 