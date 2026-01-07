import Link from 'next/link';
import Image from 'next/image';

export const metadata = {
  title: 'Privacy Policy - NikiTuttoFare',
  description: 'Informativa sulla privacy e trattamento dei dati personali di NikiTuttoFare.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/50 bg-white/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative h-10 w-10 overflow-hidden rounded-lg shadow-md">
              <Image src="/logo_ntf.png" alt="NTF Logo" fill className="object-cover" />
            </div>
            <span className="text-lg font-bold text-slate-900">
              Niki<span className="text-blue-600">Tuttofare</span>
            </span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <article className="prose prose-slate max-w-none">
          <h1>Informativa sulla Privacy</h1>
          <p className="lead">
            Ultimo aggiornamento: Gennaio 2026
          </p>

          <h2>1. Titolare del Trattamento</h2>
          <p>
            Il titolare del trattamento dei dati personali è <strong>NikiTuttoFare</strong>, 
            con sede in Rimini (RN), Italia.
          </p>
          <p>
            Per qualsiasi richiesta relativa alla privacy, puoi contattarci a: 
            <a href="mailto:privacy@nikituttofare.com">privacy@nikituttofare.com</a>
          </p>

          <h2>2. Dati Raccolti</h2>
          <p>Raccogliamo i seguenti dati personali:</p>
          <ul>
            <li><strong>Dati di contatto:</strong> email, numero di telefono (opzionale)</li>
            <li><strong>Dati sulla richiesta:</strong> descrizione del problema, indirizzo dell&apos;intervento, foto allegate</li>
            <li><strong>Dati tecnici:</strong> indirizzo IP, tipo di browser, pagine visitate (per migliorare il servizio)</li>
          </ul>

          <h2>3. Finalità del Trattamento</h2>
          <p>I tuoi dati vengono utilizzati per:</p>
          <ul>
            <li>Gestire le richieste di intervento e contattarti</li>
            <li>Inviarti aggiornamenti sullo stato del tuo ticket</li>
            <li>Migliorare il nostro servizio tramite analisi anonime</li>
            <li>Adempiere a obblighi di legge</li>
          </ul>

          <h2>4. Base Giuridica</h2>
          <p>
            Il trattamento dei dati si basa su:
          </p>
          <ul>
            <li><strong>Esecuzione contrattuale:</strong> per fornirti il servizio richiesto</li>
            <li><strong>Consenso:</strong> per l&apos;invio di comunicazioni di marketing (se acconsentito)</li>
            <li><strong>Interesse legittimo:</strong> per migliorare il servizio e prevenire frodi</li>
          </ul>

          <h2>5. Conservazione dei Dati</h2>
          <p>
            I tuoi dati vengono conservati per il tempo necessario a fornirti il servizio e comunque 
            non oltre <strong>5 anni</strong> dalla chiusura del ticket, salvo obblighi di legge.
          </p>

          <h2>6. Condivisione dei Dati</h2>
          <p>I tuoi dati possono essere condivisi con:</p>
          <ul>
            <li><strong>Tecnici partner:</strong> per eseguire l&apos;intervento richiesto</li>
            <li><strong>Fornitori di servizi:</strong> hosting (Vercel), database (Supabase), email (Resend)</li>
            <li><strong>Autorità:</strong> se richiesto dalla legge</li>
          </ul>
          <p>
            Non vendiamo né cediamo i tuoi dati a terzi per fini commerciali.
          </p>

          <h2>7. Trasferimento Extra-UE</h2>
          <p>
            Alcuni dei nostri fornitori (es. Vercel, Google) possono trasferire dati al di fuori 
            dell&apos;Unione Europea. In tal caso, ci assicuriamo che vengano rispettate le garanzie 
            previste dal GDPR (Clausole Contrattuali Standard o Data Privacy Framework).
          </p>

          <h2>8. I Tuoi Diritti</h2>
          <p>Hai il diritto di:</p>
          <ul>
            <li><strong>Accesso:</strong> richiedere copia dei tuoi dati</li>
            <li><strong>Rettifica:</strong> correggere dati inesatti</li>
            <li><strong>Cancellazione:</strong> richiedere la cancellazione dei dati (&quot;diritto all&apos;oblio&quot;)</li>
            <li><strong>Portabilità:</strong> ricevere i tuoi dati in formato elettronico</li>
            <li><strong>Opposizione:</strong> opporti al trattamento per interessi legittimi</li>
            <li><strong>Revoca consenso:</strong> ritirare il consenso in qualsiasi momento</li>
          </ul>
          <p>
            Per esercitare questi diritti, scrivi a: 
            <a href="mailto:privacy@nikituttofare.com">privacy@nikituttofare.com</a>
          </p>

          <h2>9. Cookie</h2>
          <p>
            Utilizziamo cookie tecnici necessari al funzionamento del sito e cookie analitici 
            (anonimizzati) per capire come migliorare il servizio.
          </p>
          <p>
            <strong>Cookie tecnici (essenziali):</strong> gestione sessione utente, preferenze tema.<br />
            <strong>Cookie analitici:</strong> Vercel Analytics (anonimizzato, nessun tracking personale).
          </p>
          <p>
            Puoi gestire le preferenze sui cookie tramite il banner che appare alla prima visita.
          </p>

          <h2>10. Sicurezza</h2>
          <p>
            Adottiamo misure tecniche e organizzative per proteggere i tuoi dati, tra cui:
          </p>
          <ul>
            <li>Crittografia delle comunicazioni (HTTPS/TLS)</li>
            <li>Autenticazione sicura (Magic Link, nessuna password memorizzata)</li>
            <li>Accesso limitato ai dati (solo personale autorizzato)</li>
            <li>Backup regolari e disaster recovery</li>
          </ul>

          <h2>11. Modifiche alla Privacy Policy</h2>
          <p>
            Ci riserviamo di aggiornare questa informativa. In caso di modifiche sostanziali, 
            ti avviseremo via email o tramite banner sul sito.
          </p>

          <h2>12. Reclami</h2>
          <p>
            Se ritieni che il trattamento dei tuoi dati violi il GDPR, puoi presentare reclamo 
            al <strong>Garante per la Protezione dei Dati Personali</strong>:{' '}
            <a href="https://www.garanteprivacy.it" target="_blank" rel="noopener noreferrer">
              www.garanteprivacy.it
            </a>
          </p>

          <hr />

          <p className="text-sm text-slate-500">
            Per qualsiasi domanda, contattaci:<br />
            📧 <a href="mailto:privacy@nikituttofare.com">privacy@nikituttofare.com</a><br />
            📞 +39 346 102 7447
          </p>
        </article>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-slate-500">
          <p>© 2026 NikiTuttoFare - Pronto Intervento H24</p>
          <div className="mt-2 space-x-4">
            <Link href="/" className="hover:text-slate-700">Home</Link>
            <Link href="/privacy" className="hover:text-slate-700">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-slate-700">Termini di Servizio</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
