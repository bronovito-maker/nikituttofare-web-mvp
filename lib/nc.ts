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
   * Esegue una richiesta fetch all'API NocoDB v2
   * Gestisce l'autenticazione, i body JSON e il parsing degli errori.
   */
  private async req(path: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${path}`;
    const headers = new Headers(options.headers || {});
    headers.set('xc-token', this.token);

    if (options.body && typeof options.body !== 'string') {
      try {
        options.body = JSON.stringify(options.body);
        headers.set('Content-Type', 'application/json');
      } catch (error) {
        console.error('[NocoClient Error] Errore nel serializzare il body JSON:', error);
        throw new Error('Impossibile serializzare il body della richiesta');
      }
    }

    const fetchOptions: RequestInit = {
      ...options,
      headers,
    };

    const res = await fetch(url, fetchOptions);

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error(`[NocoClient Error] Path: ${path}`, `Body: ${body}`);
      throw new Error(`NocoDB ${res.status} ${res.statusText}: ${body}`);
    }

    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      return res.json();
    }
    return res.text();
  }

  /**
   * Legge UNA singola riga da una TABELLA usando il suo ID.
   * L'API V2 standard usa GET /tables/{tableId}/records/{recordId}.
   * Ignoriamo viewId perché l'endpoint diretto per i record non lo richiede.
   */
  async readTableRow(tableId: string, rowId: number | string) {
    const path = `/tables/${tableId}/records/${rowId}`;

    console.log('[NocoDBG_v2] readTableRow (PATH GET) →', { path });

    return this.req(path, {
      method: 'GET',
    });
  }

  /**
   * Lista i record da una VISTA.
   * L'API V2 usa POST e {viewId}.
   * I parametri (where, limit, sort) vanno nel BODY JSON.
   */
  listView(tableId: string, viewId: string, params: Record<string, any> = {}) {
    const path = `/tables/${tableId}/records`;
    const body: Record<string, any> = {
      viewId,
      ...params,
    };

    if (body.limit !== undefined) body.limit = Number(body.limit);
    if (body.offset !== undefined) body.offset = Number(body.offset);

    console.log('[NocoDBG_v2] listView (PATH CORRETTO) →', { path, body });

    return this.req(path, {
      method: 'POST',
      body,
    });
  }

  // --- METODI PER LE TABELLE (CREATE, UPDATE, DELETE) ---
  // Logica usata da noco-helpers.ts

  /**
   * POST /api/v2/tables/{tableId}/records
   */
  create(tableId: string, data: any) {
    // La v2 API accetta un oggetto singolo (non un array) per la creazione singola
    const path = `/tables/${tableId}/records`;
    console.log('[NocoDBG_v2] createRecord →', { path, data });
    return this.req(path, {
      method: 'POST',
      body: data,
    });
  }

  /**
   * PATCH /api/v2/tables/{tableId}/records/{recordId}
   */
  update(tableId: string, recordId: string | number, patch: any) {
    const path = `/tables/${tableId}/records`;
    const body = [
      {
        Id: recordId,
        ...patch,
      },
    ];

    console.log('[NocoDBG_v2] updateRecord →', { path, body });

    return this.req(path, {
      method: 'PATCH',
      body,
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
    const path = `/tables/${tableId}/records${suffix}`;
    console.log('[NocoDBG_v2] findUserBy (PATH GET) →', { path });
    return this.req(path, { method: 'GET' });
  }
}
