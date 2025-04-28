#!/bin/bash

# Tester le statut de l'API backend
echo "=== Vérification du statut de l'API ==="
curl -s https://xandme-backend.onrender.com/api

# Tester les en-têtes HTTP pour vérifier CORS
echo -e "\n\n=== Vérification des en-têtes CORS ==="
curl -s -I https://xandme-backend.onrender.com/api | grep -i "access-control"

# Tester la connectivité WebSocket avec le backend
echo -e "\n\n=== Tentative de connexion WebSocket ==="
# Note: Cette commande ne fonctionnera que si curl est récent (7.68.0+)
curl -v -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" -H "Sec-WebSocket-Version: 13" -H "Sec-WebSocket-Key: $(openssl rand -base64 16)" wss://xandme-backend.onrender.com 2>&1 | grep -E 'Upgrade|HTTP|Connection'

# Vérifier les logs du backend pour voir les tentatives de connexion WebSocket
echo -e "\n\n=== Instructions pour vérifier les logs ==="
echo "Dans l'interface Render du backend, allez dans la section 'Logs' et recherchez :"
echo "- 'WebSocket server started' ou 'WebSocket connection established'"
echo "- Erreurs 'CORS' ou 'connection refused'"
echo "- Messages liés à 'Redis connection'"

# Ajoutez un rapport de diagnostic client
echo -e "\n\n=== Ajoutez ce code à la fin de MessageBox.tsx pour le diagnostic ==="
echo 'useEffect(() => {
  // Test de communication avec le backend
  fetch("https://xandme-backend.onrender.com/api")
    .then(response => response.json())
    .then(data => console.log("✅ API Backend accessible:", data))
    .catch(error => console.error("❌ Erreur API Backend:", error));
    
  // Test de WebSocket
  const testWs = new WebSocket("wss://xandme-backend.onrender.com");
  testWs.onopen = () => console.log("✅ WebSocket connecté avec succès");
  testWs.onerror = (e) => console.error("❌ Erreur WebSocket:", e);
  testWs.onclose = (e) => console.log(`❌ WebSocket fermé: Code ${e.code}, Raison: ${e.reason}`);
  
  return () => {
    if (testWs) testWs.close();
  };
}, []);' 