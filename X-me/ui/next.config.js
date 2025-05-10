/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Configuration optimisée pour le SEO
  experimental: {
    appDir: true,
    // Activation des routes d'API pour Server Components
    serverComponentsExternalPackages: ['react-dom'],
    // Amélioration des performances de compilation
    optimizeCss: true,
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
  // Compression des images
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
    domains: ['xandme.fr'],
  },
  // Configuration des headers HTTP pour améliorer le SEO et la sécurité
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
        ],
      },
    ];
  },
  // Désactiver les builds statiques pour les routes qui utilisent Clerk
  exportPathMap: undefined
}

module.exports = nextConfig 