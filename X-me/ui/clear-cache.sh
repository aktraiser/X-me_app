#!/bin/bash

# Script pour vider le cache et redémarrer l'application

echo "Suppression du cache Next.js..."
rm -rf .next
rm -rf node_modules/.cache

echo "Reconstruction de l'application..."
npm run build

echo "Cache vidé et application reconstruite avec succès!"
echo "Pour redémarrer l'application, exécutez: npm run dev" 