FROM redis:alpine

# Activer la persistance des données
CMD ["redis-server", "--appendonly", "yes"] 