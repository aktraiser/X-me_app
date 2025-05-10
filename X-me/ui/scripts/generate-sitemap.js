#!/usr/bin/env node
/**
 * Script qui génère automatiquement le sitemap.xml en analysant la structure du dossier app/
 * Pour exécuter : node scripts/generate-sitemap.js
 */

const fs = require('fs');
const path = require('path');
const prettier = require('prettier');

// Configuration
const WEBSITE_URL = 'https://xandme.fr';
const APP_DIR = path.join(process.cwd(), 'app');
const OUTPUT_FILE = path.join(process.cwd(), 'public', 'sitemap.xml');

// Pages à exclure du sitemap
const EXCLUDED_PATHS = [
  '/api',
  '/sign-in',
  '/sign-up',
  '/settings',
  '/forgot-password',
];

// Extensions de fichiers qui définissent une page
const PAGE_EXTENSIONS = ['tsx', 'jsx', 'js', 'ts'];

// Fonction qui vérifie si un chemin doit être exclu
const shouldExcludePath = (pagePath) => {
  return EXCLUDED_PATHS.some(excludedPath => pagePath.startsWith(excludedPath));
};

// Fonction qui extrait les routes à partir de la structure de dossiers app/
function extractRoutesFromAppDir(dir = APP_DIR, basePath = '') {
  let routes = [];

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  // Traitement de chaque entrée dans le répertoire
  entries.forEach(entry => {
    const fullPath = path.join(dir, entry.name);
    
    // Si c'est un dossier, traiter récursivement
    if (entry.isDirectory()) {
      // Ignorer les dossiers spéciaux de Next.js
      if (!entry.name.startsWith('_') && !entry.name.startsWith('.') && entry.name !== 'api') {
        const newBasePath = path.posix.join(basePath, entry.name === 'page' ? '' : entry.name);
        const subRoutes = extractRoutesFromAppDir(fullPath, newBasePath);
        routes = [...routes, ...subRoutes];
      }
    } 
    // Si c'est un fichier page.tsx/jsx, ajouter la route
    else if (entry.isFile() && entry.name.startsWith('page.') && PAGE_EXTENSIONS.includes(entry.name.split('.').pop())) {
      routes.push(basePath);
    }
  });

  return routes;
}

// Générer le sitemap XML
async function generateSitemap() {
  try {
    // Extraire les routes
    const routes = extractRoutesFromAppDir();
    
    // Filtrer les routes à exclure
    const filteredRoutes = routes.filter(route => !shouldExcludePath(route));
    
    // Formater les URLs
    const sitemap = `
      <?xml version="1.0" encoding="UTF-8"?>
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        ${filteredRoutes
          .map(route => {
            const url = `${WEBSITE_URL}${route}`;
            return `
              <url>
                <loc>${url}</loc>
                <lastmod>${new Date().toISOString()}</lastmod>
                <changefreq>${route === '/' ? 'daily' : 'weekly'}</changefreq>
                <priority>${route === '/' ? '1.0' : '0.7'}</priority>
              </url>
            `;
          })
          .join('')}
      </urlset>
    `;

    // Formater avec prettier
    const formattedSitemap = await prettier.format(sitemap, {
      parser: 'html',
    });

    // Écrire le fichier
    fs.writeFileSync(OUTPUT_FILE, formattedSitemap);
    
    console.log(`✅ Sitemap généré avec succès : ${OUTPUT_FILE}`);
  } catch (error) {
    console.error('❌ Erreur lors de la génération du sitemap:', error);
  }
}

// Exécuter la fonction
generateSitemap(); 