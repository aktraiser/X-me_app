/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['qytbxgzxsywnfhlwcyqa.supabase.co', 'qytbxgzxsywnfhlwcyqa.supabase.in'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 's2.googleusercontent.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'dam.malt.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.in',
        pathname: '**',
      },
    ],
  },
  async rewrites() {
    const backendUrl = process.env.NODE_ENV === 'production' 
      ? 'http://xme-backend:3001'
      : 'http://localhost:3001';
      
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;