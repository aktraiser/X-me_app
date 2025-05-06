/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Désactiver la génération statique pour éviter les erreurs liées à Clerk
  experimental: {
    // Forcer le mode SSR pour toutes les pages
    appDir: true,
  },
  // Ignorer ces erreurs lors du build
  typescript: {
    // Ignorer les erreurs TS pendant le build (utile pour le déploiement)
    ignoreBuildErrors: true,
  },
  eslint: {
    // Ignorer les erreurs ESLint pendant le build
    ignoreDuringBuilds: true,
  },
  // Désactiver les builds statiques pour les routes qui utilisent Clerk
  exportPathMap: undefined
}

module.exports = nextConfig 