// File: next.config.mjs

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Questa opzione dice a Next.js di non includere 'nocodb-sdk' nel "bundle" del server.
    // Invece, il pacchetto verrà caricato direttamente da node_modules a runtime.
    // Questo è il modo più efficace per risolvere problemi di risoluzione dei moduli durante la build.
    serverComponentsExternalPackages: ['nocodb-sdk'],
  },
};

export default nextConfig;