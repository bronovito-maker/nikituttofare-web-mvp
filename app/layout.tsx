import "./globals.css";
import { Providers } from "./providers";
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
          <main className="h-full">{children}</main>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
