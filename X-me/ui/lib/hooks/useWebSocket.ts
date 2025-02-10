import { useEffect, useState } from 'react';

export function useWebSocket() {
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
    const socket = new WebSocket(wsUrl);

    socket.addEventListener('open', () => {
      console.log('WebSocket connection established');
    });

    socket.addEventListener('error', (error) => {
      console.error('WebSocket error:', error);
    });

    socket.addEventListener('close', () => {
      console.log('WebSocket connection closed');
    });

    setWs(socket);

    return () => {
      socket.close();
    };
  }, []);

  return { ws };
} 