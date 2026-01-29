// next.config.mjs
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Questa opzione risolve problemi di compatibilità con alcune librerie
  // Risolve il warning sui lockfile multipli
  outputFileTracingRoot: path.join(__dirname),

  // Gestisci errori di caricamento .env
  onDemandEntries: {
    // period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },

  // Disabilita il caricamento automatico di .env se causa problemi
  env: {},

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'mqgkominidcysyakcbio.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;