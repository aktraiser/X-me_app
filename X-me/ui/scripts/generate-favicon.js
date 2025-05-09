const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Chemin du logo SVG
const svgPath = path.join(__dirname, '../public/images/logo.svg');
// Chemin de sortie pour le favicon
const faviconPath = path.join(__dirname, '../app/favicon.ico');
const faviconPngPath = path.join(__dirname, '../app/favicon.png');

// Lire le fichier SVG
const svgContent = fs.readFileSync(svgPath, 'utf8');

// Extraire uniquement la partie de la lettre X
const xPathRegex = /<path class="letterX"[^>]*?d="([^"]*)"[^>]*\/>/g;
const xPathMatch = xPathRegex.exec(svgContent);

if (!xPathMatch || !xPathMatch[1]) {
  console.error('Impossible de trouver le path de la lettre X dans le SVG');
  process.exit(1);
}

// Créer un SVG simplifié avec uniquement la lettre X
const xPathD = xPathMatch[1];
const simplifiedSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1100 1100" width="32" height="32">
  <path d="${xPathD}" fill="#C59D3F" transform="scale(0.39, 0.39)"/>
</svg>`;

// Écrire le SVG simplifié temporairement
const tempSvgPath = path.join(__dirname, '../temp-favicon.svg');
fs.writeFileSync(tempSvgPath, simplifiedSvg);

// Générer le favicon
async function generateFavicon() {
  try {
    // Convertir SVG en PNG
    await sharp(tempSvgPath)
      .resize(32, 32)
      .png()
      .toFile(faviconPngPath);

    // Copier le PNG pour remplacer l'ICO (solution temporaire)
    fs.copyFileSync(faviconPngPath, faviconPath);

    console.log('Favicon généré avec succès:', faviconPngPath);
    console.log('Copié en tant que favicon.ico pour compatibilité');

    // Nettoyer le fichier temporaire
    fs.unlinkSync(tempSvgPath);

  } catch (error) {
    console.error('Erreur lors de la génération du favicon:', error);
  }
}

generateFavicon(); 