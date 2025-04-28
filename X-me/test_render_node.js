// Script de test de connectivité en Node.js pour Render
const https = require('https');
const http = require('http');
const WebSocket = require('ws');

console.log('=== Test de connectivité X-me avec Node.js ===');

// Tester l'API Backend
console.log('\n=== Test de l\'API Backend ===');
https.get('https://xandme-backend.onrender.com/api', (res) => {
  console.log(`Statut HTTP: ${res.statusCode}`);
  console.log('En-têtes:', res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Réponse:', data);
    console.log('\n=== Test de l\'API terminé ===');
    
    // Tester la connexion WebSocket après que l'API test soit terminé
    testWebSocket();
  });
}).on('error', (err) => {
  console.error('Erreur lors du test de l\'API:', err.message);
  
  // On teste quand même le WebSocket même si l'API échoue
  testWebSocket();
});

// Fonction pour tester la connexion WebSocket
function testWebSocket() {
  console.log('\n=== Test WebSocket ===');
  try {
    const ws = new WebSocket('wss://xandme-backend.onrender.com');
    
    ws.on('open', function open() {
      console.log('✅ Connexion WebSocket établie avec succès!');
      
      // Envoyer un ping de test
      console.log('Envoi d\'un message ping...');
      ws.send(JSON.stringify({ type: 'ping', data: 'Test depuis Render shell' }));
      
      // Fermer après 5 secondes pour laisser le temps de recevoir des réponses
      setTimeout(() => {
        console.log('Fermeture de la connexion WebSocket...');
        ws.close();
        console.log('\n=== Test WebSocket terminé ===');
      }, 5000);
    });
    
    ws.on('message', function incoming(data) {
      console.log('✅ Message reçu du serveur WebSocket:', data);
    });
    
    ws.on('error', function error(err) {
      console.error('❌ Erreur WebSocket:', err.message);
      console.log('\n=== Test WebSocket terminé avec erreur ===');
    });
    
    ws.on('close', function close(code, reason) {
      console.log(`Connexion WebSocket fermée. Code: ${code}, Raison: ${reason || 'Non spécifiée'}`);
    });
  } catch (err) {
    console.error('❌ Erreur lors de l\'initialisation WebSocket:', err.message);
    console.log('\n=== Test WebSocket terminé avec erreur ===');
  }
} 