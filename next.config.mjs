import { withSentryConfig } from '@sentry/nextjs';
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
  output: "standalone", // <--- AGGIUNGI QUESTA RIGA (Fix 404 Vercel)

  // Workaround per InvariantError di Turbopack in Next.js 16.1.6
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

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
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://va.vercel-scripts.com https://www.clarity.ms https://*.clarity.ms https://c.bing.com; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https://*.clarity.ms https://c.bing.com https://*.supabase.co https://*.openstreetmap.org; font-src 'self' data:; connect-src 'self' https://*.sentry.io https://va.vercel-scripts.com https://www.clarity.ms https://*.clarity.ms https://c.bing.com https://*.supabase.co; worker-src 'self' blob:; frame-src 'self' https://*.clarity.ms; object-src 'none'; base-uri 'self';",
          },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "nikituttofare",

  project: "javascript-nextjs",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  // tunnelRoute: "/monitoring",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});
