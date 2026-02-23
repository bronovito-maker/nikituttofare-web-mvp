import { withSentryConfig } from '@sentry/nextjs';
import withBundleAnalyzer from '@next/bundle-analyzer';
// next.config.mjs
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Enable bundle analyzer with ANALYZE=true env var
const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

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
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', 'framer-motion', 'date-fns', 'recharts', '@radix-ui/react-icons'],
  },


  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Webpack optimizations for production
  webpack: (config, { isServer, webpack }) => {
    // Production optimizations
    if (!isServer && config.mode === 'production') {
      // Split vendor chunks more aggressively
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Separate React/Next.js framework
            framework: {
              name: 'framework',
              chunks: 'all',
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
              priority: 40,
              enforce: true,
            },
            // Separate large UI libraries
            lib: {
              test: /[\\/]node_modules[\\/](@radix-ui|framer-motion|sonner)[\\/]/,
              name: 'lib',
              priority: 30,
              reuseExistingChunk: true,
            },
            // Supabase + Auth
            supabase: {
              test: /[\\/]node_modules[\\/](@supabase|@auth)[\\/]/,
              name: 'supabase',
              priority: 25,
              reuseExistingChunk: true,
            },
            // Icons (lucide-react is heavy)
            icons: {
              test: /[\\/]node_modules[\\/](lucide-react)[\\/]/,
              name: 'icons',
              priority: 20,
              reuseExistingChunk: true,
            },
            // Commons (shared across 2+ pages)
            commons: {
              name: 'commons',
              minChunks: 2,
              priority: 10,
              reuseExistingChunk: true,
            },
          },
          maxInitialRequests: 25,
          minSize: 20000,
        },
      };

      // Terser minification with aggressive settings
      config.optimization.minimize = true;
      config.optimization.minimizer = config.optimization.minimizer.map(plugin => {
        if (plugin.constructor.name === 'TerserPlugin') {
          plugin.options.terserOptions = {
            ...plugin.options.terserOptions,
            compress: {
              ...plugin.options.terserOptions?.compress,
              drop_console: true,
              drop_debugger: true,
              pure_funcs: ['console.log', 'console.info'],
              passes: 2,
            },
            mangle: {
              safari10: true,
            },
          };
        }
        return plugin;
      });
    }

    return config;
  },

  // Note: modularizeImports for lucide-react conflicts with optimizePackageImports
  // optimizePackageImports already handles lucide-react tree-shaking

  productionBrowserSourceMaps: false, // Prevents "Unexpected token N" in browser console

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
    // CSP Policy (formatted for readability)
    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://va.vercel-scripts.com https://www.clarity.ms https://*.clarity.ms https://c.bing.com https://t.clarity.ms",
      "style-src 'self' 'unsafe-inline'",
      // CRITICAL FIX: Added c.clarity.ms explicitly
      "img-src 'self' blob: data: https://*.clarity.ms https://c.clarity.ms https://c.bing.com https://*.supabase.co https://*.openstreetmap.org https://tile.openstreetmap.org",
      "font-src 'self' data:",
      "connect-src 'self' https://*.sentry.io https://va.vercel-scripts.com https://www.clarity.ms https://*.clarity.ms https://c.clarity.ms https://c.bing.com https://*.supabase.co https://t.clarity.ms",
      "worker-src 'self' blob:",
      "frame-src 'self' https://*.clarity.ms",
      "object-src 'none'",
      "base-uri 'self'",
    ].join('; ');

    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspDirectives,
          },
          // Security Headers (bonus optimization)
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      {
        source: '/(.*).(png|jpg|jpeg|webp|ico|svg)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default bundleAnalyzer(withSentryConfig(nextConfig, {
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

  // Hide source maps from public access (security best practice)
  hideSourceMaps: true,


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
}));
