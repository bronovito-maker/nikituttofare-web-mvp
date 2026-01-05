import "./globals.css";
import { Providers } from "./providers";
import { AppHeader } from "@/components/AppHeader";
import { Toaster } from "@/components/ui/sonner";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it" suppressHydrationWarning>
      <body>
        <Providers>
          <AppHeader />
          <main className="p-4">{children}</main>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
