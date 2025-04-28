#!/bin/bash

# Couleurs pour une meilleure lisibilité
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# URLs de base
FRONTEND_URL="https://xandme-frontend.onrender.com"
BACKEND_URL="https://xandme-backend.onrender.com"
BACKEND_API_URL="${BACKEND_URL}/api"
BACKEND_WS_URL="wss://xandme-backend.onrender.com"
REDIS_URL="redis://redis-p0r3.onrender.com:6379"

echo -e "${BLUE}=== Test de connectivité X-me ===${NC}\n"

# Test HTTP frontend
echo -e "${YELLOW}Test du frontend (HTTP):${NC}"
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${FRONTEND_URL}")
if [ "$FRONTEND_STATUS" -ge 200 ] && [ "$FRONTEND_STATUS" -lt 400 ]; then
  echo -e "  Frontend accessible: ${GREEN}OK${NC} (Status: $FRONTEND_STATUS)"
else
  echo -e "  Frontend non accessible: ${RED}ÉCHEC${NC} (Status: $FRONTEND_STATUS)"
fi

# Test HTTP backend API
echo -e "\n${YELLOW}Test du backend API (HTTP):${NC}"
BACKEND_RESPONSE=$(curl -s "${BACKEND_API_URL}")
BACKEND_STATUS=$?
if [ $BACKEND_STATUS -eq 0 ]; then
  echo -e "  Backend API accessible: ${GREEN}OK${NC}"
  echo -e "  Réponse: $BACKEND_RESPONSE"
else
  echo -e "  Backend API non accessible: ${RED}ÉCHEC${NC}"
fi

# Test WebSocket
echo -e "\n${YELLOW}Test de la connexion WebSocket:${NC}"
# Utilisation de websocat s'il est installé
if command -v websocat &> /dev/null; then
  echo -e "  Tentative de connexion avec websocat..."
  timeout 5 websocat --no-close "${BACKEND_WS_URL}" || echo -e "  Connexion WebSocket: ${RED}ÉCHEC${NC} (timeout)"
else
  echo -e "  ${YELLOW}L'outil websocat n'est pas installé.${NC}"
  echo -e "  Pour tester les WebSockets, installez websocat ou utilisez un outil en ligne comme websocket.org"
  echo -e "  Command d'installation: brew install websocat (macOS) ou cargo install websocat (avec Rust)"
fi

# Test Redis
echo -e "\n${YELLOW}Test de la connexion Redis:${NC}"
if command -v redis-cli &> /dev/null; then
  echo -e "  Tentative de connexion avec redis-cli..."
  REDIS_PING=$(redis-cli -u "${REDIS_URL}" ping 2>&1)
  if [[ "$REDIS_PING" == "PONG" ]]; then
    echo -e "  Connexion Redis: ${GREEN}OK${NC}"
  else
    echo -e "  Connexion Redis: ${RED}ÉCHEC${NC}"
    echo -e "  Erreur: $REDIS_PING"
  fi
else
  echo -e "  ${YELLOW}L'outil redis-cli n'est pas installé.${NC}"
  echo -e "  Pour tester Redis, installez redis-cli: brew install redis (macOS)"
fi

# Test complet avec curl vers le backend
echo -e "\n${YELLOW}Test détaillé du backend API:${NC}"
curl -v "${BACKEND_API_URL}" 2>&1 | grep -E "Connected|< HTTP"

# Vérification des configurations d'environnement
echo -e "\n${YELLOW}Variables d'environnement côté frontend:${NC}"
echo -e "  NEXT_PUBLIC_API_URL devrait être: ${BACKEND_API_URL}"
echo -e "  NEXT_PUBLIC_WS_URL devrait être: ${BACKEND_WS_URL}"
echo -e "  NEXT_PUBLIC_APP_URL devrait être: ${FRONTEND_URL}"

echo -e "\n${YELLOW}Variables d'environnement côté backend:${NC}"
echo -e "  REDIS_URL devrait être: ${REDIS_URL}"

echo -e "\n${BLUE}=== Test terminé ===${NC}" 