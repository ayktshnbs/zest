/** @type {import('next').NextConfig} */

// The storefront has no API of its own beyond /api/chat — everything else is
// proxied to the Express backend. If BACKEND_URL is missing in a production
// build the rewrite list comes back empty, Next has no matching route, and
// EVERY auth/order/catalog call 404s at runtime with no warning anywhere.
// Fail the build instead: a broken deploy is much more expensive than a red CI.
//
// NEXT_PUBLIC_API_URL is the escape hatch for talking to the backend
// cross-origin (lib/api.ts prefers it), so either one satisfies the check.
const backendUrl = process.env.BACKEND_URL?.replace(/\/$/, "");
const publicApiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

if (process.env.NODE_ENV === "production" && !backendUrl && !publicApiUrl) {
  throw new Error(
    [
      "",
      "Missing API backend configuration.",
      "",
      "  Set BACKEND_URL to the deployed Express API origin, e.g.",
      "    BACKEND_URL=https://zest-api.onrender.com",
      "",
      "  This is what /api/:path* is rewritten to. Without it the storefront",
      "  builds fine but every API call 404s in production (login, orders,",
      "  catalog, admin).",
      "",
      "  Alternatively set NEXT_PUBLIC_API_URL to call the API cross-origin.",
      "  See DEPLOY.md and .env.example.",
      "",
    ].join("\n"),
  );
}

const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      // Cloudinary — admin product/category image uploads
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },
  // Proxy API calls to the Express backend so the browser stays same-origin in
  // production (cookies/CSRF/login work without cross-site cookies). Set
  // BACKEND_URL in the Vercel project env to the deployed API URL. The local
  // Next route /api/chat takes precedence (rewrites run after filesystem routes).
  async rewrites() {
    if (!backendUrl) return [];
    return [{ source: '/api/:path*', destination: `${backendUrl}/api/:path*` }];
  },
};

export default nextConfig;
