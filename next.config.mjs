// next.config.mjs

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Questa opzione risolve problemi di compatibilità con alcune librerie
  serverExternalPackages: ['nocodb-sdk'],
};

export default nextConfig;