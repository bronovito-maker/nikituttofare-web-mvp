// lib/nc.ts
// Client REST v2 "Senior" per NocoDB
// Supporta sia Tabelle (per C-U-D) che Viste (per R)

export type NocoClientOpts = { baseUrl: string; token: string };

export class Noco {
  private baseUrl: string;
  private token: string;

  constructor({ baseUrl, token }: NocoClientOpts) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.token = token;
  }

  /**
   * Esecutore di richieste generico
   */
  private async req(path: string, init: RequestInit = {}) {
    const res = await fetch(this.baseUrl + path, {
      ...init,
      headers: {
        'xc-token': this.token,
        'content-type': 'application/json',
        ...(init.headers || {}),
      },
      cache: 'no-store', // Non vogliamo cache per le chiamate API
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error(`[NocoClient Error] Path: ${path}`, `Body: ${body}`);
      throw new Error(`NocoDB ${res.status} ${res.statusText}: ${body}`);
    }

    const ct = res.headers.get('content-type') || '';
    return ct.includes('application/json') ? res.json() : res.text();
  }

  // --- METODI PER LE VISTE (READ) ---
  // Logica usata da noco-helpers.ts

  /**
   * GET /api/v2/tables/{tableId}/views/{viewId}/records
   */
  listView(tableId: string, viewId: string, query: Record<string, any> = {}) {
    const qs = new URLSearchParams();
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null) qs.append(k, String(v));
    });
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return this.req(`/api/v2/tables/${tableId}/views/${viewId}/records${suffix}`);
  }

  /**
   * GET /api/v2/tables/{tableId}/views/{viewId}/records/{recordId}
   */
  readViewRow(tableId: string, viewId: string, recordId: string | number) {
    return this.req(`/api/v2/tables/${tableId}/views/${viewId}/records/${recordId}`);
  }

  // --- METODI PER LE TABELLE (CREATE, UPDATE, DELETE) ---
  // Logica usata da noco-helpers.ts

  /**
   * POST /api/v2/tables/{tableId}/records
   */
  create(tableId: string, data: any) {
    // La v2 API accetta un oggetto singolo (non un array) per la creazione singola
    return this.req(`/api/v2/tables/${tableId}/records`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * PATCH /api/v2/tables/{tableId}/records/{recordId}
   */
  update(tableId: string, recordId: string | number, patch: any) {
    return this.req(`/api/v2/tables/${tableId}/records/${recordId}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
  }

  // --- METODI PER AUTH (ADAPTER) ---
  // Logica usata da noco-adapter.ts

  /**
   * GET /api/v2/tables/{tableId}/records?where=(...)
   */
  findUserBy(tableId: string, query: Record<string, any> = {}) {
    const qs = new URLSearchParams();
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null) qs.append(k, String(v));
    });
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    // N.B. L'autenticazione interroga la Tabella, non la Vista, per sicurezza
    return this.req(`/api/v2/tables/${tableId}/records${suffix}`);
  }
}
