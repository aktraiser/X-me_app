import { WebSocket } from 'ws';
import { handleMessage } from './messageHandler';
import {
  getAvailableEmbeddingModelProviders,
  getAvailableChatModelProviders,
} from '../lib/providers';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { Embeddings } from '@langchain/core/embeddings';
import type { IncomingMessage } from 'http';
import logger from '../utils/logger';
import { ChatOpenAI } from '@langchain/openai';
import Redis from 'ioredis';
import { getRedisUrl } from '../config';
import crypto from 'crypto';

// Créer des connexions Redis pour pub/sub
const redisUrl = getRedisUrl();
const redisPublisher = new Redis(redisUrl);
const redisSubscriber = new Redis(redisUrl);
const redisClient = new Redis(redisUrl);

// ID unique pour cette instance de serveur
const instanceId = crypto.randomBytes(8).toString('hex');

// Constante pour le préfixe des clés dans Redis
const REDIS_CLIENT_PREFIX = 'websocket:client:';
const REDIS_CHANNEL = 'websocket:messages';

// Map pour stocker les WebSockets locaux
const localClients = new Map();

// S'abonner au canal Redis pour les messages interserveurs
redisSubscriber.subscribe(REDIS_CHANNEL);
redisSubscriber.on('message', (channel, message) => {
  if (channel === REDIS_CHANNEL) {
    try {
      const { targetInstanceId, clientId, type, data } = JSON.parse(message);
      
      // Ignorer les messages qui ne sont pas destinés à cette instance
      if (targetInstanceId && targetInstanceId !== instanceId) {
        return;
      }
      
      // Trouver le client local correspondant à l'ID
      const client = localClients.get(clientId);
      if (client && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type, data }));
      }
    } catch (error) {
      logger.error(`Erreur lors du traitement du message Redis: ${error}`);
    }
  }
});

// Enregistrer un client dans Redis
async function registerClient(clientId: string, ws: WebSocket) {
  try {
    // Stocker le client localement
    localClients.set(clientId, ws);
    
    // Stocker l'association entre le client et l'instance dans Redis
    await redisClient.set(`${REDIS_CLIENT_PREFIX}${clientId}`, instanceId, 'EX', 3600); // 1 heure
    
    // Ajouter un identifiant au WebSocket
    (ws as any).clientId = clientId;
    
    logger.debug(`Client ${clientId} enregistré sur l'instance ${instanceId}`);
  } catch (error) {
    logger.error(`Erreur lors de l'enregistrement du client ${clientId}: ${error}`);
  }
}

// Désenregistrer un client de Redis
async function unregisterClient(clientId: string) {
  try {
    // Supprimer le client localement
    localClients.delete(clientId);
    
    // Supprimer l'association entre le client et l'instance dans Redis
    await redisClient.del(`${REDIS_CLIENT_PREFIX}${clientId}`);
    
    logger.debug(`Client ${clientId} désenregistré`);
  } catch (error) {
    logger.error(`Erreur lors du désenregistrement du client ${clientId}: ${error}`);
  }
}

// Envoyer un message à un client spécifique via Redis
export async function sendMessageToClient(clientId: string, type: string, data: any) {
  try {
    // Vérifier si le client est sur cette instance
    if (localClients.has(clientId)) {
      const ws = localClients.get(clientId);
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type, data }));
        return true;
      }
    }
    
    // Sinon, vérifier dans Redis et envoyer via pub/sub
    const targetInstanceId = await redisClient.get(`${REDIS_CLIENT_PREFIX}${clientId}`);
    if (targetInstanceId) {
      await redisPublisher.publish(
        REDIS_CHANNEL,
        JSON.stringify({
          targetInstanceId,
          clientId,
          type,
          data
        })
      );
      return true;
    }
    
    return false;
  } catch (error) {
    logger.error(`Erreur lors de l'envoi du message au client ${clientId}: ${error}`);
    return false;
  }
}

export const handleConnection = async (
  ws: WebSocket,
  request: IncomingMessage,
) => {
  try {
    // Générer un ID unique pour ce client WebSocket
    const clientId = crypto.randomBytes(16).toString('hex');
    
    // Enregistrer le client dans Redis
    await registerClient(clientId, ws);

    const [chatModelProviders, embeddingModelProviders] = await Promise.all([
      getAvailableChatModelProviders(),
      getAvailableEmbeddingModelProviders(),
    ]);

    // --- Force specific models --- START ---
    const chatModelProvider = 'gemini';
    const chatModel = 'gemini-2.0-flash'; // Defaulting to gemini-2.0-flash
    const embeddingModelProvider = 'openai';
    const embeddingModel = 'text-embedding-3-small';
    // --- Force specific models --- END ---

    let llm: BaseChatModel | undefined;
    let embeddings: Embeddings | undefined;

    // Directly assign LLM based on hardcoded values
    if (
      chatModelProviders[chatModelProvider] &&
      chatModelProviders[chatModelProvider][chatModel]
    ) {
      llm = chatModelProviders[chatModelProvider][chatModel]
        .model as unknown as BaseChatModel | undefined;
    }

    // Assign embeddings based on hardcoded values
    if (
      embeddingModelProviders[embeddingModelProvider] &&
      embeddingModelProviders[embeddingModelProvider][embeddingModel]
    ) {
      embeddings = embeddingModelProviders[embeddingModelProvider][
        embeddingModel
      ].model as Embeddings | undefined;
    }

    if (!llm || !embeddings) {
      ws.send(
        JSON.stringify({
          type: 'error',
          data: 'Invalid LLM or embeddings model selected, please refresh the page and try again.',
          key: 'INVALID_MODEL_SELECTED',
        }),
      );
      ws.close();
      return;
    }

    // Informer le client qu'il est connecté et lui donner son ID
    const interval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: 'signal',
            data: 'open',
            clientId: clientId,
            instanceId: instanceId
          }),
        );
        clearInterval(interval);
      }
    }, 5);

    // Ajouter des propriétés d'état pour la gestion des heartbeats
    (ws as any).isAlive = true;
    ws.on('pong', () => {
      (ws as any).isAlive = true;
    });

    ws.on(
      'message',
      async (message) =>
        await handleMessage(message.toString(), ws, llm, embeddings),
    );

    ws.on('close', async () => {
      logger.debug(`Connection ${clientId} closed`);
      await unregisterClient(clientId);
    });

    ws.on('error', (error) => {
      logger.error(`WebSocket error for client ${clientId}: ${error.message}`);
    });

  } catch (err) {
    ws.send(
      JSON.stringify({
        type: 'error',
        data: 'Internal server error.',
        key: 'INTERNAL_SERVER_ERROR',
      }),
    );
    ws.close();
    logger.error(err);
  }
};

// Vérification de l'état des connexions
export function startHeartbeat(wss) {
  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if ((ws as any).isAlive === false) {
        // Si le client n'a pas répondu au dernier ping, le fermer
        const clientId = (ws as any).clientId;
        if (clientId) {
          unregisterClient(clientId).catch(err => 
            logger.error(`Erreur lors du nettoyage du client ${clientId}: ${err}`)
          );
        }
        return ws.terminate();
      }
      
      // Marquer le client comme inactif et envoyer un ping
      (ws as any).isAlive = false;
      ws.ping(() => {});
    });
  }, 30000); // Vérification toutes les 30 secondes
  
  return interval;
}
