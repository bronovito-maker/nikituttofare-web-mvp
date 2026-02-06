import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { CookieConsentProvider } from "@/components/providers/cookie-consent-provider";
import { CookieBanner } from "@/components/ui/cookie-banner";
import { AutoThemeWatcher } from "@/components/providers/auto-theme-watcher";
import { AnimationProvider } from "@/components/providers/animation-provider";
import { Toaster } from "sonner";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "900"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NikiTuttoFare - Pronto Intervento H24",
  description: "Idraulici, Elettricisti e Fabbri a Rimini e Riccione. Intervento garantito in 60 minuti.",
  keywords: ["pronto intervento", "idraulico", "elettricista", "fabbro", "Rimini", "Riccione", "H24"],
  authors: [{ name: "NikiTuttoFare" }],
  openGraph: {
    title: "NikiTuttoFare - Pronto Intervento H24",
    description: "Manutenzione d'emergenza semplice e sicura. Preventivi AI, intervento in 60 minuti.",
    type: "website",
  },
  icons: {
    icon: "/logo_ntf.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#0f172a",
};

import { MicrosoftClarity } from "@/components/analytics/microsoft-clarity";
import { VercelAnalyticsLazy } from "@/components/analytics/vercel-analytics-lazy";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" className={dmSans.variable} suppressHydrationWarning>
      <head>
        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

        {/* Performance Optimization: Preconnect to critical origins */}
        <link rel="preconnect" href="https://mqgkominidcysyakcbio.supabase.co" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://o4510796370214912.ingest.de.sentry.io" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://www.clarity.ms" />

        {/* Fallback DNS Prefetch */}
        <link rel="dns-prefetch" href="https://mqgkominidcysyakcbio.supabase.co" />
        <link rel="dns-prefetch" href="https://o4510796370214912.ingest.de.sentry.io" />

        {/*
          GDPR TODO: Wrap future tracking scripts with CookieConsentProvider condition.
          ...
        */}
      </head>
      <body className={`${dmSans.className} antialiased`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <CookieConsentProvider>
            <AnimationProvider>
              <AutoThemeWatcher />
              {children}
              <CookieBanner />
              <Toaster />
              <VercelAnalyticsLazy />
              <MicrosoftClarity />
            </AnimationProvider>
          </CookieConsentProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

