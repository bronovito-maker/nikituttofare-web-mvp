// next.config.mjs
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Questa opzione risolve problemi di compatibilità con alcune librerie
  // Risolve il warning sui lockfile multipli
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;