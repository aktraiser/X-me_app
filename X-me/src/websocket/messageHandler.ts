import { EventEmitter, WebSocket } from 'ws';
import { BaseMessage, AIMessage, HumanMessage } from '@langchain/core/messages';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { Embeddings } from '@langchain/core/embeddings';
import logger from '../utils/logger';
import db from '../db';
import { chats, messages as messagesSchema, MessageInsert, ChatInsert } from '../db/schema';
import { eq, asc, gt } from 'drizzle-orm';
import crypto from 'crypto';
import { getFileDetails } from '../utils/files';
import MetaSearchAgent, {
  MetaSearchAgentType,
} from '../search/metaSearchAgent';
import prompts from '../prompts';
import { MessageType, ChatType, WSMessageType, SearchHandlerType } from '../types/messages';
import p from 'p-limit';
import { sendMessageToClient } from './connectionManager';
import os from 'os';
import { suggestionService } from '../services/suggestionService';

// Types simplifiés pour l'usage local si nécessaire
type Message = {
  messageId: string;
  chatId: string;
  content: string;
};

type WSMessage = WSMessageType;

// Limiter le nombre de traitements parallèles en fonction des CPU disponibles
const cpuCount = os.cpus().length;
// 75% des CPU disponibles, au moins 1
const concurrencyLimit = Math.max(1, Math.floor(cpuCount * 0.75));
const messageLimit = p(concurrencyLimit);

export const searchHandlers = {
  webSearch: new MetaSearchAgent({
    activeEngines: ['google'],
    queryGeneratorPrompt: prompts.webSearchRetrieverPrompt,
    responsePrompt: prompts.webSearchResponsePrompt,
    rerank: true,
    rerankThreshold: 0.5,
    searchWeb: true,
    summarizer: false,
    searchDatabase: true,
    useOpenAISearch: true,
    useFirecrawl: true,
    searchModel: 'gpt-4o-mini'
  }),
  academicSearch: new MetaSearchAgent({
    activeEngines: ['google'],
    queryGeneratorPrompt: prompts.academicSearchRetrieverPrompt,
    responsePrompt: prompts.academicSearchResponsePrompt,
    rerank: true,
    rerankThreshold: 0.5,
    searchWeb: true,
    summarizer: false,
    searchDatabase: true,
    useOpenAISearch: true,
    useFirecrawl: true,
    searchModel: 'gpt-4o-mini'
  }),
  writingAssistant: new MetaSearchAgent({
    activeEngines: [],
    queryGeneratorPrompt: '',
    responsePrompt: prompts.writingAssistantPrompt,
    rerank: false,
    rerankThreshold: 0,
    searchWeb: false,
    summarizer: false,
    searchDatabase: true,
    useOpenAISearch: false
  }),
  wolframAlphaSearch: new MetaSearchAgent({
    activeEngines: ['wolframalpha'],
    queryGeneratorPrompt: prompts.wolframAlphaSearchRetrieverPrompt,
    responsePrompt: prompts.wolframAlphaSearchResponsePrompt,
    rerank: false,
    rerankThreshold: 0,
    searchWeb: true,
    summarizer: false,
    searchDatabase: true,
    useOpenAISearch: true,
    useFirecrawl: true,
    searchModel: 'gpt-4o-mini'
  }),
  youtubeSearch: new MetaSearchAgent({
    activeEngines: ['youtube'],
    queryGeneratorPrompt: prompts.youtubeSearchRetrieverPrompt,
    responsePrompt: prompts.youtubeSearchResponsePrompt,
    rerank: true,
    rerankThreshold: 0.3,
    searchWeb: true,
    summarizer: false,
    searchDatabase: true,
    useOpenAISearch: true,
    searchModel: 'gpt-4o-mini-search-preview-2025-03-11'
  }),
  redditSearch: new MetaSearchAgent({
    activeEngines: ['reddit'],
    queryGeneratorPrompt: prompts.redditSearchRetrieverPrompt,
    responsePrompt: prompts.redditSearchResponsePrompt,
    rerank: true,
    rerankThreshold: 0.3,
    searchWeb: true,
    summarizer: false,
    searchDatabase: true,
    useOpenAISearch: true,
    searchModel: 'gpt-4o-mini-search-preview-2025-03-11'
  }),
};

const handleEmitterEvents = (
  emitter: EventEmitter,
  ws: WebSocket,
  messageId: string,
  chatId: string,
) => {
  let receivedMessage = '';
  let sources = [];
  let isFirstChunk = true;
  let messageBuffer = '';
  const BUFFER_THRESHOLD = 50;
  const TYPING_DELAY = 10;
  let lastEmitTime = Date.now();
  const MIN_EMIT_INTERVAL = 20;
  
  // Récupérer le clientId du WebSocket s'il existe
  const clientId = (ws as any).clientId;

  console.log('[DEBUG] Initialisation handleEmitterEvents:', { messageId, chatId, clientId });

  emitter.on('data', async (data) => {
    try {
      const parsedData = JSON.parse(data);

      if (parsedData.type === 'response' || parsedData.type === 'message') {
        messageBuffer += parsedData.data;
        const currentTime = Date.now();
        
        if (isFirstChunk) {
          // Envoyer directement à ce WebSocket spécifique (ce qui est plus rapide)
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(
              JSON.stringify({
                type: 'message',
                data: messageBuffer,
                messageId: messageId,
              }),
            );
          } else if (clientId) {
            // Envoyer via le système distribué si le WebSocket n'est plus ouvert
            await sendMessageToClient(clientId, 'message', {
              data: messageBuffer,
              messageId: messageId,
            });
          }
          
          messageBuffer = '';
          isFirstChunk = false;
          lastEmitTime = currentTime;
        } else if (messageBuffer.length >= BUFFER_THRESHOLD && currentTime - lastEmitTime >= MIN_EMIT_INTERVAL) {
          // Même logique pour les chunks suivants
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(
              JSON.stringify({
                type: 'message',
                data: messageBuffer,
                messageId: messageId,
              }),
            );
          } else if (clientId) {
            await sendMessageToClient(clientId, 'message', {
              data: messageBuffer,
              messageId: messageId,
            });
          }
          
          messageBuffer = '';
          lastEmitTime = currentTime;
        }
        
        receivedMessage += parsedData.data;
      } else if (parsedData.type === 'sources') {
        console.log('[DEBUG] Sources reçues dans messageHandler:', {
          count: parsedData.data?.length || 0,
          firstSource: parsedData.data[0]?.metadata?.title || 'No title'
        });
        sources = parsedData.data;
        
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: 'sources',
              data: parsedData.data,
              messageId: messageId,
            }),
          );
        } else if (clientId) {
          await sendMessageToClient(clientId, 'sources', {
            data: parsedData.data,
            messageId: messageId,
          });
        }
      } else if (parsedData.type === 'researchActivity') {
        // Transmission des activités de recherche Firecrawl
        console.log('[DEBUG] Activité de recherche reçue:', {
          type: parsedData.data?.type, 
          message: parsedData.data?.message,
          depth: parsedData.data?.depth
        });
        
        // Transmettre directement au client
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: 'researchActivity',
              data: parsedData.data,
              messageId: messageId,
            }),
          );
        } else if (clientId) {
          await sendMessageToClient(clientId, 'researchActivity', {
            data: parsedData.data,
            messageId: messageId,
          });
        }
      } else if (parsedData.type === 'suggestions') {
        // Envoyer les suggestions
        console.log('📦 [DEBUG] Émetteur a reçu des suggestions:', {
          suggestionsCount: parsedData.data?.suggestions?.length || 0,
          messageId: messageId
        });
        
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: 'suggestions',
              data: parsedData.data,
              messageId: messageId,
            }),
          );
        } else if (clientId) {
          await sendMessageToClient(clientId, 'suggestions', {
            data: parsedData.data,
            messageId: messageId,
          });
        }
      }
    } catch (error) {
      console.error('❌ Erreur lors du traitement des données:', error);
      // Ne pas arrêter le processus, continuer avec les prochaines données
    }
  });

  emitter.on('end', async () => {
    console.log('[DEBUG] Event end reçu:', {
      finalMessageLength: receivedMessage.length,
      sourcesCount: sources.length,
      messageId
    });

    if (messageBuffer.length > 0) {
      // Envoyer le dernier buffer
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: 'message',
            data: messageBuffer,
            messageId: messageId,
          }),
        );
      } else if (clientId) {
        await sendMessageToClient(clientId, 'message', {
          data: messageBuffer,
          messageId: messageId,
        });
      }
    }
    
    // DÉSACTIVÉ - Les suggestions sont maintenant générées par metaSearchAgent
    /*
    // Générer et envoyer automatiquement les suggestions à la fin du message
    try {
      console.log('🚀 [DEBUG] Génération automatique de suggestions à la fin du message');
      // Utiliser le dernier message reçu pour générer des suggestions
      const suggestions = await suggestionService.getSuggestions(receivedMessage);
      
      console.log('✅ [DEBUG] Suggestions générées automatiquement:', suggestions?.length || 0);
      
      // Envoyer les suggestions au client
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: 'suggestions',
            data: { suggestions },
            messageId: messageId,
          }),
        );
      } else if (clientId) {
        await sendMessageToClient(clientId, 'suggestions', {
          data: { suggestions },
          messageId: messageId,
        });
      }
    } catch (error) {
      console.error('❌ [DEBUG] Erreur lors de la génération automatique de suggestions:', error);
    }
    */
    console.log('✅ [DEBUG] Fin du traitement, utilisant les suggestions générées par metaSearchAgent');
    
    // NOUVEAU: Envoyer un événement messageEnd pour indiquer au client que le message est terminé
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: 'messageEnd',
          messageId: messageId,
        }),
      );
    } else if (clientId) {
      await sendMessageToClient(clientId, 'messageEnd', {
        messageId: messageId,
      });
    }
  });
};

export const handleMessage = async (
  message: string,
  ws: WebSocket,
  llm: BaseChatModel,
  embeddings: Embeddings,
) => {
  // Utiliser messageLimit pour limiter les traitements parallèles
  messageLimit(async () => {
    try {
      const parsedWSMessage: WSMessage = JSON.parse(message);
      
      // Gérer les suggestions
      if (parsedWSMessage.type === 'suggestions') {
        console.log('📝 [DEBUG WebSocket] Requête de suggestions reçue:', {
          messageId: parsedWSMessage.message.messageId,
          contentPreview: parsedWSMessage.message.content.substring(0, 50)
        });
        
        const suggestions = await suggestionService.getSuggestions(parsedWSMessage.message.content);
        
        console.log('✅ [DEBUG WebSocket] Suggestions générées:', {
          count: suggestions.length,
          suggestions: suggestions
        });
        
        if (ws.readyState === WebSocket.OPEN) {
          console.log('📤 [DEBUG WebSocket] Envoi des suggestions via WS direct');
          ws.send(JSON.stringify({
            type: 'suggestions',
            data: {
              suggestions: suggestions
            },
            messageId: parsedWSMessage.message.messageId
          }));
        } else if ((ws as any).clientId) {
          console.log('📤 [DEBUG WebSocket] Envoi des suggestions via Redis');
          await sendMessageToClient((ws as any).clientId, 'suggestions', {
            data: {
              suggestions: suggestions
            },
            messageId: parsedWSMessage.message.messageId
          });
        }
        return;
      }

      let parsedMessage: Message;
      
      // Validate message structure
      if (!parsedWSMessage.message || !parsedWSMessage.type) {
        return ws.send(
          JSON.stringify({
            type: 'error',
            data: 'Invalid message format',
            key: 'INVALID_FORMAT',
          }),
        );
      }

      parsedMessage = parsedWSMessage.message;

      console.log('[DEBUG] Received message:', {
        focusMode: parsedWSMessage.focusMode,
        content: parsedMessage.content?.substring(0, 50) + (parsedMessage.content?.length > 50 ? '...' : ''),
        type: parsedWSMessage.type,
        clientId: (ws as any).clientId
      });

      if (parsedWSMessage.files?.length > 0) {
        parsedWSMessage.focusMode = 'webSearch';
      }

      const humanMessageId =
        parsedMessage.messageId ?? crypto.randomBytes(7).toString('hex');
      const aiMessageId = crypto.randomBytes(7).toString('hex');

      if (!parsedMessage.content)
        return ws.send(
          JSON.stringify({
            type: 'error',
            data: 'Invalid message format',
            key: 'INVALID_FORMAT',
          }),
        );

      const history: BaseMessage[] = (parsedWSMessage.history || []).map((msg) => {
        if (msg[0] === 'human') {
          return new HumanMessage({
            content: msg[1],
          });
        } else {
          return new AIMessage({
            content: msg[1],
          });
        }
      });

      if (parsedWSMessage.type === 'message') {
        console.log('[DEBUG] Getting handler for mode:', {
          requestedMode: parsedWSMessage.focusMode,
          clientId: (ws as any).clientId
        });
        
        const handler: MetaSearchAgentType | undefined = searchHandlers[parsedWSMessage.focusMode];

        if (handler) {
          try {
            const emitter = await handler.searchAndAnswer(
              parsedMessage.content,
              history,
              llm,
              embeddings,
              parsedWSMessage.optimizationMode,
              parsedWSMessage.files,
            );

            console.log('[DEBUG] Setting up emitter events for client', (ws as any).clientId);
            handleEmitterEvents(emitter, ws, aiMessageId, parsedMessage.chatId);

            const chat = await db.query.chats.findFirst({
              where: eq(chats.id, parsedMessage.chatId),
            });

            if (!chat) {
              // Utilisation du type ChatInsert
              const chatData: ChatInsert = {
                id: parsedMessage.chatId,
                title: parsedMessage.content,
                createdAt: new Date().toString(),
                focusMode: parsedWSMessage.focusMode,
                files: parsedWSMessage.files.map(getFileDetails),
              };
              
              await db
                .insert(chats)
                .values(chatData)
                .execute();
            }

            const messageExists = await db.query.messages.findFirst({
              where: eq(messagesSchema.messageId, humanMessageId),
            });

            if (!messageExists) {
              // Utilisation du type MessageInsert
              const messageData: MessageInsert = {
                content: parsedMessage.content,
                chatId: parsedMessage.chatId,
                messageId: humanMessageId,
                type: 'user', // Nom correct du champ dans la DB
                metadata: JSON.stringify({
                  createdAt: new Date(),
                }),
              };
              
              await db
                .insert(messagesSchema)
                .values(messageData)
                .execute();
            } else {
              await db
                .delete(messagesSchema)
                .where(gt(messagesSchema.id, messageExists.id))
                .execute();
            }
          } catch (err) {
            console.error('[DEBUG] Error in handler:', err);
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(
                JSON.stringify({
                  type: 'error',
                  data: err instanceof Error ? err.message : 'Error processing message',
                  key: 'HANDLER_ERROR',
                }),
              );
            } else if ((ws as any).clientId) {
              await sendMessageToClient((ws as any).clientId, 'error', {
                data: err instanceof Error ? err.message : 'Error processing message',
                key: 'HANDLER_ERROR',
              });
            }
          }
        } else {
          console.error('[DEBUG] Invalid focus mode:', parsedWSMessage.focusMode);
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(
              JSON.stringify({
                type: 'error',
                data: 'Invalid focus mode',
                key: 'INVALID_FOCUS_MODE',
              }),
            );
          } else if ((ws as any).clientId) {
            await sendMessageToClient((ws as any).clientId, 'error', {
              data: 'Invalid focus mode',
              key: 'INVALID_FOCUS_MODE',
            });
          }
        }
      }
    } catch (err) {
      console.error('[DEBUG] Error parsing message:', err);
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: 'error',
            data: 'Invalid message format',
            key: 'INVALID_FORMAT',
          }),
        );
      } else if ((ws as any).clientId) {
        await sendMessageToClient((ws as any).clientId, 'error', {
          data: 'Invalid message format',
          key: 'INVALID_FORMAT',
        });
      }
      logger.error(`Failed to handle message: ${err}`);
    }
  }).catch(err => {
    console.error('Erreur lors de l\'exécution du message limité:', err);
  });
};