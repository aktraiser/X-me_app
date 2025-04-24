import express from 'express';
import { searchFirecrawl, type SearchResult } from '../lib/firecrawlSearch';
import logger from '../utils/logger';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    // Rechercher des actualités en parallèle avec Firecrawl
    const searches = [
      // Actualités sur l'IA
      searchFirecrawl('actualités technologie intelligence artificielle site:businessinsider.com OR site:www.exchangewire.com OR site:yahoo.com', {
        limit: 5,
        maxDepth: 1,
        timeLimit: 20
      }),
      
      // Actualités sur la tech
      searchFirecrawl('actualités tech innovation business site:businessinsider.com OR site:www.exchangewire.com OR site:yahoo.com', {
        limit: 5,
        maxDepth: 1,
        timeLimit: 20
      }),
      
      // Actualités business
      searchFirecrawl('actualités business entrepreneuriat site:businessinsider.com OR site:www.exchangewire.com OR site:yahoo.com', {
        limit: 5,
        maxDepth: 1,
        timeLimit: 20
      })
    ];
    
    const results = await Promise.all(searches);
    
    // Combiner et transformer les résultats
    const articles = results
      .flatMap(result => result.results as SearchResult[])
      .map((result: SearchResult) => ({
        title: result.title,
        content: result.content || '',
        url: result.url,
        img_src: result.img_src || null,
        favicon: result.favicon || null
      }))
      // Filtrer les doublons par URL
      .filter((article, index, self) => 
        index === self.findIndex(a => a.url === article.url)
      )
      // Mélanger les résultats
      .sort(() => Math.random() - 0.5);

    return res.json({ articles });
  } catch (err: any) {
    logger.error(`Error in news route: ${err.message}`);
    return res.status(500).json({ message: 'An error has occurred' });
  }
});

export default router;
