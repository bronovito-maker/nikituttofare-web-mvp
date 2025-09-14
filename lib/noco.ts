// lib/noco.ts

export async function getUserByEmail(base: string, token: string, tableId: string, email: string) {
  // Aggiungiamo un controllo per dare un errore più chiaro se l'URL non è configurato.
  if (!base || !token || !tableId) {
    throw new Error("Variabili d'ambiente per NocoDB (URL, Token, o Table ID) non trovate. Controlla il file .env.local e riavvia il server.");
  }

  try {
    const urlBase = base.replace(/\/$/, "");
    const where = encodeURIComponent(`(email,eq,${email})`);
    // --- MODIFICA CHIAVE: Usiamo il percorso API corretto di NocoDB v2 ---
    const url = `${urlBase}/api/v2/tables/${tableId}/records?where=${where}&limit=1`;
    
    console.log(`[NocoDB] Chiamata a: ${url}`); // Log utile per il debug

    const res = await fetch(url, { headers: { "xc-token": token, accept: "application/json" }, cache: "no-store" });
    
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Errore da NocoDB: ${res.status} - ${errorText}`);
    }

    const data = await res.json();
    const list = data?.list ?? [];
    return Array.isArray(list) && list[0] ? list[0] : null;

  } catch (error) {
    console.error("Errore di rete o API in getUserByEmail:", error);
    throw new Error("Impossibile connettersi al database degli utenti.");
  }
}

export async function createUser(base: string, token: string, tableId: string, rec: any) {
  if (!base || !token || !tableId) {
    throw new Error("Variabili d'ambiente per NocoDB (URL, Token, o Table ID) non trovate. Controlla il file .env.local e riavvia il server.");
  }

  try {
    const urlBase = base.replace(/\/$/, "");
     // --- MODIFICA CHIAVE: Usiamo il percorso API corretto di NocoDB v2 ---
    const url = `${urlBase}/api/v2/tables/${tableId}/records`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "xc-token": token, "Content-Type": "application/json" },
      body: JSON.stringify(rec),
    });
    
    if (!res.ok) {
        throw new Error(`NocoDB (createUser) fallito: ${res.status} ${await res.text()}`);
    }
    return res.json();
    
  } catch (error) {
    console.error("Errore di rete o API in createUser:", error);
    throw new Error("Impossibile creare l'utente nel database.");
  }
}