"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ShieldCheck, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!email || !email.includes("@")) {
      toast.error("Inserisci un'email valida per continuare.");
      setIsLoading(false);
      return;
    }

    try {
      // Usiamo il provider "credentials" configurato in auth.ts
      // In modalità sviluppo, accetta qualsiasi email senza password
      const result = await signIn("credentials", {
        email,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Errore durante l'accesso. Riprova.");
      } else {
        toast.success("Accesso effettuato!");
        router.push("/chat"); // Porta l'utente alla chat
        router.refresh();
      }
    } catch (error) {
      toast.error("Qualcosa è andato storto.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md shadow-xl border-slate-200 bg-white">
        <CardHeader className="space-y-1 text-center pb-2">
          <div className="mx-auto bg-blue-100 p-3 rounded-full w-fit mb-2">
            <ShieldCheck className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">
            Benvenuto in NikiTuttoFare
          </CardTitle>
          <CardDescription className="text-slate-500 text-base">
            Per iniziare la diagnosi e ricevere un preventivo, ci serve solo la tua email.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 font-medium">
                Indirizzo Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="nome@esempio.it"
                className="h-12 text-lg border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
              <p className="text-xs text-slate-400">
                Non serve registrarsi. Se sei nuovo, creeremo un profilo istantaneo per te.
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Accesso in corso...
                </>
              ) : (
                <>
                  Inizia Diagnosi <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="bg-slate-50 border-t border-slate-100 p-6">
          <p className="text-xs text-center text-slate-400 w-full leading-relaxed">
            Continuando, accetti i nostri Termini di Servizio. 
            I tuoi dati sono protetti e usati solo per gestire l'intervento.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}