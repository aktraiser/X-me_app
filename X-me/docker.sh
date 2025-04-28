#!/bin/bash

# Script pour démarrer l'application en mode conteneurisé avec Redis
# Auteur: ClaudeAI

set -e

# Vérifier si Docker est installé
if ! command -v docker &> /dev/null; then
    echo "Docker n'est pas installé. Veuillez l'installer et réessayer."
    exit 1
fi

# Vérifier si Docker Compose est installé
if ! command -v docker compose &> /dev/null; then
    echo "Docker Compose n'est pas installé. Veuillez l'installer et réessayer."
    exit 1
fi

# Récupérer le répertoire du script
SCRIPT_DIR=$(dirname "$0")
cd "$SCRIPT_DIR"

echo "🔄 Arrêt des conteneurs existants..."
docker compose down

echo "🔄 Création/mise à jour des images..."
docker compose build

echo "🚀 Démarrage des conteneurs..."
docker compose up -d

echo "✅ Application démarrée avec succès!"
echo "📊 Frontend: http://localhost:3000"
echo "📡 Backend: http://localhost:3001"
echo "💾 Redis: localhost:6379"

echo ""
echo "Pour voir les logs, exécutez:"
echo "docker compose logs -f"
echo ""
echo "Pour arrêter l'application, exécutez:"
echo "docker compose down" 