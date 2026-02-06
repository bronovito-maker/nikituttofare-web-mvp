import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { CookieConsentProvider } from "@/components/providers/cookie-consent-provider";
import { CookieBanner } from "@/components/ui/cookie-banner";
import { AutoThemeWatcher } from "@/components/providers/auto-theme-watcher";
import { Toaster } from "sonner";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "600"],
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

import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { MicrosoftClarity } from "@/components/analytics/microsoft-clarity"; // Add import

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" className={dmSans.variable} suppressHydrationWarning>
      <head>
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
            <AutoThemeWatcher />
            {children}
            <CookieBanner />
            <Toaster />
            <Analytics />
            <SpeedInsights />
            <MicrosoftClarity />
          </CookieConsentProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

