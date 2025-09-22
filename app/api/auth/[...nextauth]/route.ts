// File: app/api/auth/[...nextauth]/route.ts

// Importiamo gli handler dal file auth.ts centralizzato
import { handlers } from "@/auth";

// Esportiamo gli handler per le richieste GET e POST
export const { GET, POST } = handlers;