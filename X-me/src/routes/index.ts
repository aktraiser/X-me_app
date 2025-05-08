import express from 'express';
import imagesRouter from './images';
import videosRouter from './videos';
import configRouter from './config';
import modelsRouter from './models';
import suggestionsRouter from './suggestions';
import chatRoutes from './chats';
import searchRouter from './search';
import newsRouter from './news';
import uploadsRouter from './uploads';
import legalRouter from './legal';
import discoverRouter from './discover';
import expertsRouter from './experts';
import cronRouter from './cron';
import logger from '../utils/logger';

const router = express.Router();

// Endpoint ping pour les health checks
router.get('/ping', (_, res) => {
  res.status(200).json({ status: 'pong', timestamp: new Date().toISOString() });
});

router.use('/images', imagesRouter);
router.use('/videos', videosRouter);
router.use('/config', configRouter);
router.use('/models', modelsRouter);
router.use('/suggestions', suggestionsRouter);
router.use('/chats', chatRoutes);
router.use('/search', searchRouter);
router.use('/news', newsRouter);
router.use('/uploads', uploadsRouter);
router.use('/legal', legalRouter);
router.use('/discover', discoverRouter);
router.use('/experts', expertsRouter);
router.use('/cron', cronRouter);

// Route webhook pour les notifications Supabase
router.post('/webhooks/supabase', async (req, res) => {
  try {
    const { table, event, record, old_record } = req.body;
    
    logger.info(`Webhook Supabase reçu: ${event} sur ${table}`);
    
    // Valider le payload
    if (!table || !event || !record) {
      return res.status(400).json({ message: 'Payload incomplet' });
    }
    
    // Traiter uniquement les tables concernées
    if (table === 'chats') {
      // Synchroniser immédiatement une discussion modifiée/créée
      if (event === 'INSERT' || event === 'UPDATE') {
        const chatId = record.id;
        
        if (chatId) {
          try {
            // Appeler la route de synchronisation pour une discussion spécifique
            const syncRes = await fetch(`http://localhost:${process.env.PORT || 3001}/api/chats/sync-single-chat`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ chatId }),
            });
            
            if (syncRes.ok) {
              logger.info(`Discussion ${chatId} synchronisée avec succès via webhook`);
            } else {
              const errorData = await syncRes.json() as { message?: string };
              logger.error(`Erreur lors de la synchronisation via webhook: ${errorData?.message || 'Erreur inconnue'}`);
            }
          } catch (syncError) {
            logger.error(`Exception lors de la synchronisation via webhook: ${(syncError as Error).message}`);
          }
        }
      }
      
      // Supprimer les discussions supprimées
      if (event === 'DELETE' && old_record && old_record.id) {
        const chatId = old_record.id;
        try {
          // Appeler la route de suppression
          const deleteRes = await fetch(`http://localhost:${process.env.PORT || 3001}/api/chats/${chatId}`, {
            method: 'DELETE'
          });
          
          if (deleteRes.ok) {
            logger.info(`Discussion ${chatId} supprimée avec succès via webhook`);
          } else {
            const errorData = await deleteRes.json() as { message?: string };
            logger.error(`Erreur lors de la suppression via webhook: ${errorData?.message || 'Erreur inconnue'}`);
          }
        } catch (deleteError) {
          logger.error(`Exception lors de la suppression via webhook: ${(deleteError as Error).message}`);
        }
      }
    }
    
    return res.status(200).json({ success: true });
  } catch (err) {
    logger.error(`Erreur dans le webhook Supabase: ${(err as Error).message}`);
    res.status(500).json({ message: 'Une erreur est survenue lors du traitement du webhook' });
  }
});

export default router;
