module.exports = {
  i18n: {
    defaultLocale: 'fr',
    locales: ['fr', 'en'], // Ajouter d'autres langues si nécessaire
  },
  // Ceci est nécessaire pour que next-i18next fonctionne avec app directory de Next.js
  reloadOnPrerender: process.env.NODE_ENV === 'development',
}; 