import { WebSocketServer } from 'ws';
import { handleConnection } from './connectionManager';
import http from 'http';
import { getPort } from '../config';
import logger from '../utils/logger';
import cluster from 'cluster';
import os from 'os';

const numCPUs = os.cpus().length;

export const initServer = (
  server: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>,
) => {
  const port = getPort();
  const wss = new WebSocketServer({ server });

  wss.on('connection', handleConnection);

  // Configuration des événements de terminaison du serveur WebSocket
  wss.on('close', () => {
    logger.info(`WebSocket server on worker ${process.pid} closed`);
  });

  wss.on('error', (error) => {
    logger.error(`WebSocket server error on worker ${process.pid}: ${error.message}`);
  });

  // Loggez l'identifiant du processus
  logger.info(`WebSocket server started on port ${port} - Worker ${process.pid}`);
  
  // Fonction de contrôle d'état du serveur WebSocket
  const checkWssHealth = () => {
    return {
      status: 'healthy',
      connections: wss.clients.size,
      pid: process.pid,
    };
  };

  return { wss, checkWssHealth };
};

// Fonction pour initialiser un serveur WebSocket dans un environnement de cluster
export const initClusteredServer = () => {
  if (cluster.isPrimary) {
    logger.info(`Master process ${process.pid} is running`);

    // Créer des workers basés sur le nombre de CPU disponibles
    for (let i = 0; i < Math.max(2, numCPUs - 1); i++) {
      cluster.fork();
    }

    // Gérer la terminaison des workers
    cluster.on('exit', (worker, code, signal) => {
      logger.warn(`Worker ${worker.process.pid} died with code: ${code}, signal: ${signal}`);
      logger.info('Starting a new worker');
      cluster.fork();
    });
  } else {
    // Code pour les workers
    logger.info(`Worker ${process.pid} started`);
    
    // Le serveur HTTP sera créé par app.ts, nous fournissons juste l'initialisation
  }
};
