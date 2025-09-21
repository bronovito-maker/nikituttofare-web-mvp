import Link from 'next/link';
import { Button } from '@/components/ui/button';
import React from 'react'; // Aggiunto per correttezza

export const chatCopy = {
  clarification_2_task: "Perfetto, grazie. C'è qualche dettaglio importante o difficoltà che dovrei sapere? Ad esempio, il tipo di muro, se servono attrezzi particolari, ecc.",
  clarification_2_problem: "Capito. Per darmi un quadro completo, la situazione è stabile o sta peggiorando?",
  clarification_3: "Ok, ci siamo quasi. C'è qualche altra informazione che pensi possa essere utile per il tecnico?",
  ask_name: "Ottimo, grazie per i dettagli! Ho tutte le informazioni tecniche. Ora mi servono solo alcuni dati per organizzare l'intervento. Come ti chiami?",
  ask_address_and_city: "Grazie! Mi puoi dare l'indirizzo completo per l'intervento, includendo la città?",
  ask_phone: "Perfetto. Qual è il numero di telefono su cui possiamo contattarti per aggiornamenti?",
  ask_email: "Se preferisci, puoi lasciarmi anche un'email (è facoltativo, puoi scrivere 'no').",
  ask_timeslot: "Hai una disponibilità preferita per l'intervento? (es. 'domani mattina', 'oggi pomeriggio', 'sono flessibile')",
  confirm_summary: "Fantastico, abbiamo finito! Ecco il riepilogo completo della tua richiesta. Dai un'occhiata per assicurarti che sia tutto corretto:",
  confirm_action: "È tutto giusto? Se mi dici 'sì', invio subito la richiesta ai nostri tecnici. Se vuoi cambiare qualcosa, scrivi 'modifica'.",
  ask_modification: "Certo. Cosa vuoi modificare? Puoi scrivere 'nome', 'indirizzo', 'telefono', 'email' o 'disponibilità'.",
  modification_acknowledged: "Ok, ho aggiornato. Controlla di nuovo il riepilogo qui sopra. È tutto corretto ora?",
  out_of_area: "Al momento la tua zona non è coperta direttamente dal nostro servizio standard. Possiamo comunque inoltrare la richiesta: se un tecnico accetta, potrebbe essere applicato un costo extra per la trasferta. Vuoi che proviamo lo stesso?",
  error: (message: string) => `Ops! Qualcosa è andato storto nell'invio: ${message}`,
  cancel: "Nessun problema, ho annullato la richiesta. Se vuoi iniziare una nuova richiesta, descrivi il tuo nuovo problema.",
  off_topic: "Sono un assistente virtuale per le richieste di intervento. Se hai bisogno di aiuto per un problema in casa, descrivimelo e sarò felice di aiutarti.",
  
  sent: (ticketId: string, isRegistered: boolean, onRedirect: () => void) => {
    if (isRegistered) {
      return (
        <div className="space-y-3">
          <p>✅ <strong>Richiesta inviata con successo!</strong></p>
          <p>Il tuo numero di ticket è <strong>{ticketId}</strong>. Puoi visualizzare tutti i dettagli e seguire lo stato di avanzamento direttamente nella tua dashboard.</p>
          <Button onClick={onRedirect} className="w-full mt-2">
            Vai alla Richiesta
          </Button>
        </div>
      );
    }
    
    return (
      <div className="space-y-3">
        <p>✅ <strong>Fatto! Richiesta inviata.</strong></p>
        <p>Il tuo codice di riferimento è <strong>{ticketId}</strong>. Ti aggiorneremo non appena un tecnico prenderà in carico il lavoro.</p>
        <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg text-center">
            <p className="text-sm font-semibold">Vuoi seguire la tua richiesta online?</p>
            <p className="text-xs text-muted-foreground mt-1 mb-3">Registrati gratuitamente per vedere i dettagli, lo stato e comunicare con il tecnico.</p>
            <Button asChild size="sm">
                <Link href="/register">Registrati Ora</Link>
            </Button>
        </div>
      </div>
    );
  }
};