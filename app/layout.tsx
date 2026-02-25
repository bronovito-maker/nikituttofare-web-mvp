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
  title: "NikiTuttoFare - Pronto Intervento H24 Rimini, Riccione e Misano",
  description: "Il tuo tuttofare di fiducia a Rimini, Riccione e Misano Adriatico. Idraulici, Elettricisti e Fabbri esperti. Intervento garantito in 2 ore.",
  keywords: ["tuttofare Rimini", "tuttofare Riccione", "pronto intervento", "idraulico Rimini", "elettricista Riccione", "fabbro Misano", "H24", "riparazioni casa"],
  authors: [{ name: "NikiTuttoFare" }],
  openGraph: {
    title: "NikiTuttoFare - Pronto Intervento H24",
    description: "Manutenzione d'emergenza semplice e sicura. Preventivi AI, intervento in 60 minuti.",
    type: "website",
  },
  icons: {
    icon: "/logo_ntf.svg",
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
import { MetaPixel } from "@/components/analytics/meta-pixel";

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
        <link rel="preconnect" href="https://connect.facebook.net" />

        {/* Fallback DNS Prefetch */}
        <link rel="dns-prefetch" href="https://mqgkominidcysyakcbio.supabase.co" />
        <link rel="dns-prefetch" href="https://o4510796370214912.ingest.de.sentry.io" />
        <link rel="dns-prefetch" href="https://connect.facebook.net" />

        {/*
          GDPR Compliance: Analytics scripts (Clarity, Meta Pixel, Vercel Analytics)
          are loaded conditionally based on CookieConsentProvider preferences.
          See components/providers/cookie-consent-provider.tsx
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
              <MetaPixel />
            </AnimationProvider>
          </CookieConsentProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

