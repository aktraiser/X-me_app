import express, { Request, Response, Router } from 'express';
import { cleanupCaches } from '../lib/actions';
import logger from '../utils/logger';

// Clé secrète pour sécuriser l'endpoint cron
const CRON_SECRET = process.env.CRON_SECRET || 'default_cron_secret_change_me';

// Création du routeur
const router = Router();

// Définition du handler séparément
async function handleCron(req: Request, res: Response) {
  try {
    // Vérifier l'autorisation via un header secret
    const authHeader = req.headers['authorization'];
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token || token !== CRON_SECRET) {
      res.status(401).json({ error: 'Accès non autorisé' });
      return;
    }

    // Exécuter les tâches planifiées
    const cleanupResult = await cleanupCaches();
    
    // Autres tâches planifiées peuvent être ajoutées ici
    logger.info('Nettoyage du cache Firecrawl exécuté, résultat:', cleanupResult);
    
    res.status(200).json({
      success: true,
      message: 'Tâches cron exécutées avec succès',
      results: {
        cacheCleanup: cleanupResult
      }
    });
  } catch (error) {
    logger.error('Erreur pendant l\'exécution des tâches cron:', error);
    res.status(500).json({
      error: 'Erreur serveur pendant l\'exécution des tâches cron'
    });
  }
}

// Définition de la route
router.get('/', handleCron);

export default router; 