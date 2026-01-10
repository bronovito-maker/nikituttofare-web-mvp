import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { CookieBanner } from "@/components/ui/cookie-banner";

const dmSans = DM_Sans({ 
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
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
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" className={dmSans.variable} suppressHydrationWarning>
      <body className={`${dmSans.className} antialiased`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <CookieBanner />
        </ThemeProvider>
      </body>
    </html>
  );
}
