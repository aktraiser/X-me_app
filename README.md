# X-me Application

Une application d'assistance intelligente qui utilise des agents LLM pour fournir des réponses contextuelles avec des sources vérifiées.

## Fonctionnalités

- 🤖 Agents LLM multiples pour différents types de recherches
- 🔍 Recherche intelligente avec sources vérifiées
- 📚 Support pour les documents uploadés
- 🖼️ Génération d'images pertinentes
- 👥 Recherche d'experts dans le domaine
- 🌐 Interface utilisateur moderne et responsive

## Technologies

- Next.js 13+ avec App Router
- TypeScript
- Langchain pour les agents LLM
- Tailwind CSS pour le style
- OpenAI pour les modèles de langage

## Installation

1. Clonez le repository :
```bash
git clone [votre-repo-url]
cd x-me
```

2. Installez les dépendances :
```bash
npm install
# ou
yarn install
```

3. Configurez les variables d'environnement :
```bash
cp .env.example .env.local
```
Puis remplissez les variables nécessaires dans .env.local

4. Lancez le serveur de développement :
```bash
npm run dev
# ou
yarn dev
```

L'application sera disponible sur [http://localhost:3000](http://localhost:3000)

## Structure du Projet

- `/src` - Code source principal
  - `/chains` - Agents LLM et chaînes de traitement
  - `/lib` - Utilitaires et configurations
  - `/routes` - Routes API
  - `/search` - Logique de recherche
  - `/utils` - Fonctions utilitaires
- `/ui` - Interface utilisateur
  - `/components` - Composants React
  - `/app` - Pages et layout Next.js

## Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request. 