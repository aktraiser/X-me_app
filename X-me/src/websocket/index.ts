import { initServer } from './websocketServer';
import http from 'http';
import { startHeartbeat } from './connectionManager';
import logger from '../utils/logger';

export const startWebSocketServer = (
  server: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>,
) => {
  // Initialiser le serveur WebSocket et récupérer l'instance et la fonction de contrôle
  const { wss, checkWssHealth } = initServer(server);
  
  // Démarrer le mécanisme de heartbeat
  const heartbeatInterval = startHeartbeat(wss);
  
  // Gérer la fermeture propre des ressources
  process.on('SIGINT', () => {
    logger.info('Arrêt du serveur WebSocket en cours...');
    clearInterval(heartbeatInterval);
    wss.close(() => {
      logger.info('Serveur WebSocket fermé proprement');
    });
  });
  
  return { wss, checkWssHealth };
};
