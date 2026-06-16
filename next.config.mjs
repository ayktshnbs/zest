/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  // Proxy API calls to the Express backend so the browser stays same-origin in
  // production (cookies/CSRF/login work without cross-site cookies). Set
  // BACKEND_URL in the Vercel project env to the deployed API URL. The local
  // Next route /api/chat takes precedence (rewrites run after filesystem routes).
  async rewrites() {
    const backend = process.env.BACKEND_URL?.replace(/\/$/, '');
    if (!backend) return [];
    return [{ source: '/api/:path*', destination: `${backend}/api/:path*` }];
  },
};

export default nextConfig;
