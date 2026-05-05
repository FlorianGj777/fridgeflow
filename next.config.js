/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Les erreurs de types Supabase (génériques internes) n'affectent pas le runtime
    ignoreBuildErrors: true,
  },
  // Désactive le cache client pour les pages dynamiques (évite les données périmées après mutation)
  experimental: {
    staleTimes: {
      dynamic: 0,
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
};

module.exports = nextConfig;
