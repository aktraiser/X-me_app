import { startWebSocketServer } from './websocket';
import express from 'express';
import cors from 'cors';
import http from 'http';
import routes from './routes';
import { getPort } from './config';
import logger from './utils/logger';
import imagesRouter from './routes/images';
import axios from 'axios';
import cluster from 'cluster';
import { initClusteredServer } from './websocket/websocketServer';

// Vérifier si nous sommes en mode cluster
const useCluster = process.env.USE_CLUSTER === 'true';

if (useCluster) {
  // Initialiser le serveur en mode cluster
  initClusteredServer();
  
  // Le code suivant s'exécute seulement pour les workers
  if (!cluster.isPrimary) {
    startWorker();
  }
} else {
  // Mode standard (sans cluster)
  startWorker();
}

function startWorker() {
  const port = getPort();
  
  const app = express();
  const server = http.createServer(app);
  
  const corsOptions = {
    origin: '*',
  };
  
  app.use(cors(corsOptions));
  app.use(express.json());
  
  app.use('/api', routes);
  app.get('/api', (_, res) => {
    res.status(200).json({ status: 'ok' });
  });
  
  app.use('/api/images', imagesRouter);
  
  server.listen(port, () => {
    logger.info(`Server is running on port ${port} (Worker ${process.pid})`);
    
    // Synchroniser les discussions depuis Supabase vers SQLite au démarrage
    // Uniquement pour le premier worker ou en mode non-cluster
    if (!useCluster || (cluster.worker && cluster.worker.id === 1)) {
      setTimeout(async () => {
        try {
          logger.info('Démarrage de la synchronisation incrémentielle depuis Supabase...');
          
          // Initialiser les variables pour la pagination
          let hasMore = true;
          let offset = 0;
          const limit = 100;
          let totalSynced = 0;
          let batchCount = 0;
          
          // Récupérer par lots pour éviter de surcharger la mémoire
          while (hasMore) {
            try {
              logger.info(`Synchronisation du lot ${batchCount + 1}...`);
              
              const response = await axios.post(`http://localhost:${port}/api/chats/sync-from-supabase`, {
                limit,
                offset,
                // On ne filtre pas par date ou utilisateur pour la synchronisation initiale
              });
              
              if (response.data.synced > 0) {
                totalSynced += response.data.synced;
                hasMore = response.data.hasMore;
                offset = response.data.nextOffset || 0;
                batchCount++;
                
                logger.info(`Lot ${batchCount} terminé: ${response.data.synced} discussions synchronisées`);
              } else {
                hasMore = false;
                logger.info('Aucune nouvelle discussion à synchroniser');
              }
            } catch (batchError) {
              logger.error(`Erreur lors de la synchronisation du lot ${batchCount + 1}: ${batchError.message}`);
              hasMore = false;
            }
            
            // Limiter le nombre de lots pour éviter les boucles infinies
            if (batchCount >= 10) {
              logger.warn('Limite de 10 lots atteinte, arrêt de la synchronisation');
              hasMore = false;
            }
          }
          
          logger.info(`Synchronisation terminée: ${totalSynced} discussions importées en ${batchCount} lots`);
        } catch (error) {
          logger.error(`Erreur lors de la synchronisation initiale: ${error.message}`);
        }
      }, 5000); // Attendre 5 secondes pour que le serveur soit complètement démarré
    }
  });
  
  startWebSocketServer(server);
}

process.on('uncaughtException', (err, origin) => {
  logger.error(`Uncaught Exception at ${origin}: ${err}`);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
});
