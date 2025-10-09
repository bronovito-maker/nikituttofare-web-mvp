import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function ConfigurazionePage() {
  // 1. Controlliamo la sessione dell'utente sul server
  const session = await auth()

  // 2. Se non c'è una sessione (utente non loggato), lo reindirizziamo alla pagina di login
  if (!session || !session.user) {
    redirect("/login")
  }

  // 3. Se l'utente è loggato, mostriamo il contenuto della pagina
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-4">Pannello di Controllo</h1>
      <p className="text-lg text-gray-700">
        Benvenuto, {session.user.name}! Da qui potrai configurare il tuo assistente AI.
      </p>
      
      <div className="mt-8 p-6 border rounded-lg bg-gray-50">
        <h2 className="text-xl font-semibold">Configurazione Assistente</h2>
        <p className="mt-2">A breve qui potrai modificare i prompt e le informazioni del tuo receptionist.</p>
      </div>
    </div>
  )
}