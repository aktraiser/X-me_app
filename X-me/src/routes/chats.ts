import express from 'express';
import logger from '../utils/logger';
import db from '../db/index';
import { eq, gt, and } from 'drizzle-orm';
import { chats, messages } from '../db/schema';
import { createClient } from '@supabase/supabase-js';

interface DbChat {
  id: string;
  title: string;
  createdAt: string;
  focusMode: string;
  messages: { content: string }[];
}

interface MessageMetadata {
  createdAt: string;
  sources?: any[];
}

const router = express.Router();

// Nouvelle route pour synchroniser les discussions depuis Supabase vers SQLite
router.post('/sync-from-supabase', async (req, res) => {
  try {
    // Récupérer les paramètres de pagination et de filtre
    const { limit = 100, offset = 0, since, userId } = req.body;
    
    const supabase = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_KEY || ''
    );

    // Construire la requête avec filtres
    let query = supabase.from('chats').select('*');
    
    // Filtre par date de mise à jour si fourni
    if (since) {
      query = query.gt('updated_at', since);
    }
    
    // Filtre par utilisateur si fourni
    if (userId) {
      query = query.eq('metadata->clerk_user_id', userId);
    }
    
    // Appliquer la pagination
    const { data: supabaseChats, error } = await query
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      logger.error(`Erreur lors de la récupération des discussions depuis Supabase: ${error.message}`);
      return res.status(500).json({ 
        message: 'Erreur lors de la récupération des discussions depuis Supabase',
        error: error.message
      });
    }

    if (!supabaseChats || supabaseChats.length === 0) {
      return res.status(200).json({ 
        message: 'Aucune discussion trouvée dans Supabase', 
        synced: 0,
        hasMore: false
      });
    }

    let syncedCount = 0;
    
    // Utiliser Promise.all pour paralléliser le traitement
    await Promise.all(supabaseChats.map(async (chat) => {
      // Vérification de sécurité - le chat est-il valide?
      if (!chat || !chat.id) return;
      
      try {
        // Vérifier si cette discussion existe déjà dans SQLite
        const existingChat = await db.query.chats.findFirst({
          where: eq(chats.id, chat.id),
        });

        // Récupérer les messages complets depuis Supabase
        if (chat.metadata?.complete_conversation) {
          const completeConversation = chat.metadata.complete_conversation;
          
          // Si la discussion n'existe pas dans SQLite, la créer
          if (!existingChat) {
            await db.insert(chats)
              .values({
                id: chat.id,
                title: chat.title || 'Conversation importée',
                createdAt: new Date().toString(),
                focusMode: chat.metadata?.focus_mode || 'webSearch',
                user_id: chat.metadata?.clerk_user_id || null,
                last_updated: new Date().toISOString()
              })
              .execute();
          } else {
            // Vérifier si le chat a été modifié depuis la dernière synchronisation
            const chatUpdatedAt = new Date(chat.updated_at || chat.created_at);
            const lastSyncDate = existingChat.last_updated ? new Date(existingChat.last_updated) : new Date(0);
            
            if (chatUpdatedAt > lastSyncDate) {
              // Mettre à jour uniquement si nécessaire
              await db.update(chats)
                .set({
                  title: chat.title || existingChat.title,
                  focusMode: chat.metadata?.focus_mode || existingChat.focusMode,
                  last_updated: new Date().toISOString()
                })
                .where(eq(chats.id, chat.id))
                .execute();
                
              // Supprimer tous les messages existants pour cette discussion
              await db.delete(messages)
                .where(eq(messages.chatId, chat.id))
                .execute();
    
              // Ajouter les nouveaux messages avec Promise.all pour parallélisation
              await Promise.all(completeConversation.map(async (msg) => {
                const messageData = {
                  content: msg.content,
                  chatId: chat.id,
                  messageId: msg.messageId || `imported-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                  type: msg.role,
                  metadata: JSON.stringify({
                    createdAt: msg.createdAt || new Date(),
                    ...(msg.sources && { sources: msg.sources }),
                  }),
                  user_id: chat.metadata?.clerk_user_id || null
                };
    
                await db.insert(messages)
                  .values(messageData)
                  .execute();
              }));
            }
          }
          
          syncedCount++;
        }
      } catch (chatError) {
        logger.error(`Erreur lors du traitement du chat ${chat.id}: ${chatError.message}`);
        // On continue avec les autres chats
      }
    }));

    // Déterminer s'il y a plus de résultats à récupérer
    const hasMore = supabaseChats.length === limit;

    return res.status(200).json({ 
      message: `Synchronisation réussie: ${syncedCount} discussions importées depuis Supabase vers SQLite`,
      synced: syncedCount,
      hasMore,
      nextOffset: hasMore ? offset + limit : null
    });
  } catch (err) {
    logger.error(`Erreur lors de la synchronisation depuis Supabase: ${err.message}`);
    res.status(500).json({ message: 'Une erreur est survenue lors de la synchronisation' });
  }
});

// Nouvelle route pour synchroniser une seule discussion
router.post('/sync-single-chat', async (req, res) => {
  try {
    const { chatId } = req.body;
    
    if (!chatId) {
      return res.status(400).json({ message: 'ID de discussion requis' });
    }
    
    const supabase = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_KEY || ''
    );

    // Récupérer une discussion spécifique
    const { data: chat, error } = await supabase
      .from('chats')
      .select('*')
      .eq('id', chatId)
      .single();

    if (error) {
      logger.error(`Erreur lors de la récupération de la discussion ${chatId}: ${error.message}`);
      return res.status(500).json({ 
        message: `Erreur lors de la récupération de la discussion ${chatId}`,
        error: error.message
      });
    }

    if (!chat) {
      return res.status(404).json({ message: 'Discussion non trouvée dans Supabase' });
    }

    // Vérifier si cette discussion existe déjà dans SQLite
    const existingChat = await db.query.chats.findFirst({
      where: eq(chats.id, chat.id),
    });

    // Récupérer les messages complets depuis Supabase
    if (chat.metadata?.complete_conversation) {
      const completeConversation = chat.metadata.complete_conversation;
      
      // Si la discussion n'existe pas dans SQLite, la créer
      if (!existingChat) {
        await db.insert(chats)
          .values({
            id: chat.id,
            title: chat.title || 'Conversation importée',
            createdAt: new Date().toString(),
            focusMode: chat.metadata?.focus_mode || 'webSearch',
            user_id: chat.metadata?.clerk_user_id || null,
            last_updated: new Date().toISOString()
          })
          .execute();
      } else {
        // Mettre à jour les informations de la discussion
        await db.update(chats)
          .set({
            title: chat.title || existingChat.title,
            focusMode: chat.metadata?.focus_mode || existingChat.focusMode,
            last_updated: new Date().toISOString()
          })
          .where(eq(chats.id, chat.id))
          .execute();
      }

      // Supprimer tous les messages existants pour cette discussion
      await db.delete(messages)
        .where(eq(messages.chatId, chat.id))
        .execute();

      // Ajouter les nouveaux messages
      await Promise.all(completeConversation.map(async (msg) => {
        const messageData = {
          content: msg.content,
          chatId: chat.id,
          messageId: msg.messageId || `imported-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          type: msg.role,
          metadata: JSON.stringify({
            createdAt: msg.createdAt || new Date(),
            ...(msg.sources && { sources: msg.sources }),
          }),
          user_id: chat.metadata?.clerk_user_id || null
        };

        await db.insert(messages)
          .values(messageData)
          .execute();
      }));

      return res.status(200).json({ 
        message: `Discussion ${chatId} synchronisée avec succès`,
        synced: 1
      });
    } else {
      return res.status(400).json({ 
        message: `La discussion ${chatId} ne contient pas de données complètes`
      });
    }
  } catch (err) {
    logger.error(`Erreur lors de la synchronisation de la discussion: ${err.message}`);
    res.status(500).json({ message: 'Une erreur est survenue lors de la synchronisation' });
  }
});

// Route pour synchroniser les discussions d'un utilisateur spécifique
router.post('/sync-user-chats', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ message: 'ID utilisateur requis' });
    }
    
    // Synchroniser les discussions de l'utilisateur par lots
    let totalSynced = 0;
    let currentOffset = 0;
    let hasMore = true;
    const limit = 100;
    let batchCount = 0;
    
    // Continuer à synchroniser tant qu'il y a plus de discussions
    while (hasMore && batchCount < 10) {
      const syncReqBody = { 
        userId,
        limit,
        offset: currentOffset
      };
      
      try {
        // Appeler directement la route de synchronisation
        const supabase = createClient(
          process.env.SUPABASE_URL || '',
          process.env.SUPABASE_KEY || ''
        );
        
        // Construire la requête avec filtres pour cet utilisateur
        let query = supabase.from('chats').select('*');
        query = query.eq('metadata->clerk_user_id', userId);
        
        // Appliquer la pagination
        const { data: supabaseChats, error } = await query
          .order('updated_at', { ascending: false })
          .range(currentOffset, currentOffset + limit - 1);
          
        if (error) {
          throw error;
        }
        
        if (!supabaseChats || supabaseChats.length === 0) {
          hasMore = false;
          break;
        }
        
        // Utiliser la même logique que dans /sync-from-supabase mais pour ce lot
        let syncedCount = 0;
        
        // Utiliser Promise.all pour paralléliser le traitement
        await Promise.all(supabaseChats.map(async (chat) => {
          // Vérification de sécurité
          if (!chat || !chat.id) return;
          
          try {
            // Vérifier si cette discussion existe déjà dans SQLite
            const existingChat = await db.query.chats.findFirst({
              where: eq(chats.id, chat.id),
            });
            
            // Récupérer les messages complets
            if (chat.metadata?.complete_conversation) {
              const completeConversation = chat.metadata.complete_conversation;
              
              if (!existingChat) {
                await db.insert(chats)
                  .values({
                    id: chat.id,
                    title: chat.title || 'Conversation importée',
                    createdAt: new Date().toString(),
                    focusMode: chat.metadata?.focus_mode || 'webSearch',
                    user_id: userId,
                    last_updated: new Date().toISOString()
                  })
                  .execute();
              } else {
                // Mettre à jour uniquement si nécessaire
                const chatUpdatedAt = new Date(chat.updated_at || chat.created_at);
                const lastSyncDate = existingChat.last_updated ? new Date(existingChat.last_updated) : new Date(0);
                
                if (chatUpdatedAt > lastSyncDate) {
                  await db.update(chats)
                    .set({
                      title: chat.title || existingChat.title,
                      focusMode: chat.metadata?.focus_mode || existingChat.focusMode,
                      last_updated: new Date().toISOString()
                    })
                    .where(eq(chats.id, chat.id))
                    .execute();
                    
                  // Supprimer les messages existants
                  await db.delete(messages)
                    .where(eq(messages.chatId, chat.id))
                    .execute();
                    
                  // Ajouter les nouveaux messages
                  await Promise.all(completeConversation.map(async (msg) => {
                    const messageData = {
                      content: msg.content,
                      chatId: chat.id,
                      messageId: msg.messageId || `imported-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                      type: msg.role,
                      metadata: JSON.stringify({
                        createdAt: msg.createdAt || new Date(),
                        ...(msg.sources && { sources: msg.sources }),
                      }),
                      user_id: userId
                    };
                    
                    await db.insert(messages)
                      .values(messageData)
                      .execute();
                  }));
                }
              }
              
              syncedCount++;
            }
          } catch (chatError) {
            logger.error(`Erreur lors du traitement du chat ${chat.id}: ${chatError.message}`);
          }
        }));
        
        // Mettre à jour les compteurs
        totalSynced += syncedCount;
        batchCount++;
        
        // Vérifier s'il y a plus de résultats
        hasMore = supabaseChats.length === limit;
        if (hasMore) {
          currentOffset += limit;
        }
        
      } catch (batchError) {
        logger.error(`Erreur lors du traitement du lot ${batchCount}: ${batchError.message}`);
        hasMore = false;
      }
    }
    
    return res.status(200).json({
      message: `Synchronisation des discussions pour l'utilisateur ${userId} terminée`,
      totalSynced,
      batches: batchCount
    });
  } catch (err) {
    logger.error(`Erreur lors de la synchronisation des discussions utilisateur: ${err.message}`);
    res.status(500).json({ message: 'Une erreur est survenue lors de la synchronisation' });
  }
});

router.get('/', async (_, res) => {
  try {
    const dbChats = await db.query.chats.findMany();

    const formattedChats = await Promise.all(dbChats.map(async (chat) => {
      const messages = await db.query.messages.findMany({
        where: (messages) => eq(messages.role, 'assistant') && eq(messages.chatId, chat.id as string)
      });

      // Trier les messages par date de création
      const sortedMessages = messages.sort((a, b) => {
        const aMetadata = JSON.parse(a.metadata as string) as MessageMetadata;
        const bMetadata = JSON.parse(b.metadata as string) as MessageMetadata;
        return new Date(bMetadata.createdAt).getTime() - new Date(aMetadata.createdAt).getTime();
      });

      // Prendre le premier message (le plus récent)
      const latestMessage = sortedMessages[0];
      const previewContent = latestMessage?.content 
        ? latestMessage.content.substring(0, 100) + (latestMessage.content.length > 100 ? '...' : '')
        : chat.title;

      return {
        id: chat.id,
        title: chat.title,
        createdAt: chat.createdAt,
        focusMode: chat.focusMode,
        content: previewContent,
        lastUpdated: chat.last_updated
      };
    }));

    return res.status(200).json({ chats: formattedChats.reverse() });
  } catch (err) {
    res.status(500).json({ message: 'An error has occurred.' });
    logger.error(`Error in getting chats: ${err.message}`);
  }
});

router.get('/:id', async (req, res) => {
  try {
    const chatExists = await db.query.chats.findFirst({
      where: eq(chats.id, req.params.id),
    });

    if (!chatExists) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    const chatMessages = await db.query.messages.findMany({
      where: eq(messages.chatId, req.params.id),
    });

    return res.status(200).json({ chat: chatExists, messages: chatMessages });
  } catch (err) {
    res.status(500).json({ message: 'An error has occurred.' });
    logger.error(`Error in getting chat: ${err.message}`);
  }
});

router.delete(`/:id`, async (req, res) => {
  try {
    const chatExists = await db.query.chats.findFirst({
      where: eq(chats.id, req.params.id),
    });

    if (!chatExists) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    await db.delete(chats).where(eq(chats.id, req.params.id)).execute();
    await db
      .delete(messages)
      .where(eq(messages.chatId, req.params.id))
      .execute();

    return res.status(200).json({ message: 'Chat deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'An error has occurred.' });
    logger.error(`Error in deleting chat: ${err.message}`);
  }
});

export default router;
