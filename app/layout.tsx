import { auth } from "@/auth";
import "./globals.css";
import Link from "next/link";
import { Providers } from "./providers";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    // --- CORREZIONE QUI ---
    <html lang="it" suppressHydrationWarning>
      <body>
        <Providers>
          <nav className="bg-white shadow-md p-4 mb-8">
            <div className="container mx-auto flex justify-between items-center">
              <Link href="/" className="text-xl font-bold text-gray-800">
                AI Receptionist
              </Link>
              <div>
                {session?.user ? (
                  <Link href="/dashboard/configurazione" className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700">
                    Dashboard
                  </Link>
                ) : (
                  <Link href="/login" className="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700">
                    Login
                  </Link>
                )}
              </div>
            </div>
          </nav>
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}