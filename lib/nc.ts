// lib/nc.ts
// Client REST v2 "Senior" per NocoDB
// Supporta sia Tabelle (per C-U-D) che Viste (per R)

export type NocoClientOpts = { baseUrl: string; token: string };

type JsonLikeBody = Record<string, unknown> | Array<unknown>;
type NocoRequestInit = Omit<RequestInit, 'body'> & {
  body?: RequestInit['body'] | JsonLikeBody | null;
};

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
  private async req(path: string, options: NocoRequestInit = {}) {
    const url = `${this.baseUrl}${path}`;
    const { body: rawBody, ...rest } = options;
    const headers = new Headers(rest.headers || {});
    headers.set('xc-token', this.token);

    let body: RequestInit['body'] | undefined;

    const isReadableStream =
      typeof ReadableStream !== 'undefined' && rawBody instanceof ReadableStream;
    const isBlob = typeof Blob !== 'undefined' && rawBody instanceof Blob;
    const isFormData = typeof FormData !== 'undefined' && rawBody instanceof FormData;

    if (rawBody === undefined || rawBody === null) {
      body = undefined;
    } else if (
      typeof rawBody === 'string' ||
      rawBody instanceof ArrayBuffer ||
      isBlob ||
      isFormData ||
      rawBody instanceof URLSearchParams ||
      isReadableStream
    ) {
      body = rawBody;
    } else {
      try {
        body = JSON.stringify(rawBody as JsonLikeBody);
        headers.set('Content-Type', 'application/json');
      } catch (error) {
        console.error('[NocoClient Error] Errore nel serializzare il body JSON:', error);
        throw new Error('Impossibile serializzare il body della richiesta');
      }
    }

    const fetchOptions: RequestInit = {
      ...rest,
      headers,
      body,
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
  async listView(tableId: string, viewId: string, params: Record<string, any> = {}) {
    const path = `/tables/${tableId}/records`;
    const body: Record<string, any> = {
      viewId,
      ...params,
    };

    if (body.limit !== undefined) body.limit = Number(body.limit);
    if (body.offset !== undefined) body.offset = Number(body.offset);

    console.log('[NocoDBG_v2] listView (PATH CORRETTO) →', { path, body });

    const result = await this.req(path, {
      method: 'POST',
      body,
    });

    console.log(
      `[NocoClient RAW listView Response] ${tableId}:`,
      JSON.stringify(result)
    );

    if (
      result &&
      typeof result === 'object' &&
      !Array.isArray(result) &&
      'list' in result &&
      'pageInfo' in result
    ) {
      console.log(`[NocoClient] listView ${tableId} ha restituito il formato V2 standard.`);
      (result as any).list = Array.isArray((result as any).list) ? (result as any).list : [];
      return result;
    }

    if (Array.isArray(result)) {
      console.warn(`[NocoClient] listView ${tableId} ha restituito un Array (formato V1?). Lo normalizzo.`);
      return {
        list: result,
        pageInfo: {
          totalRows: result.length,
          page: 1,
          pageSize: params?.limit ?? result.length,
        },
      };
    }

    if (result && typeof result === 'object' && !Array.isArray(result) && 'Id' in result) {
      console.warn(`[NocoClient] listView ${tableId} ha restituito un singolo oggetto. Lo normalizzo in una lista.`);
      return {
        list: [result],
        pageInfo: { totalRows: 1, page: 1, pageSize: 1 },
      };
    }

    console.error(`[NocoClient] listView ${tableId} ha restituito una risposta inattesa:`, result);
    return { list: [], pageInfo: { totalRows: 0, page: 1, pageSize: 0 } };
  }

  /**
   * Restituisce il conteggio dei record per una tabella usando l'endpoint /count.
   */
  async getRecordCount(tableId: string, params: { where?: string } = {}): Promise<number> {
    if (!tableId) {
      throw new Error('[NocoClient] getRecordCount richiede un tableId');
    }

    const qs = new URLSearchParams();
    if (params.where) {
      qs.append('where', params.where);
    }
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    const path = `/tables/${tableId}/records/count${suffix}`;

    console.log('[NocoDBG_v2] getRecordCount (PATH GET) →', { path });

    try {
      const result = await this.req(path, { method: 'GET' });
      if (
        typeof result === 'object' &&
        result !== null &&
        typeof (result as { count?: unknown }).count === 'number'
      ) {
        return (result as { count: number }).count;
      }
      console.warn(`[NocoClient] Risposta inattesa da ${path}:`, result);
      return 0;
    } catch (error) {
      console.error(`[NocoClient] Errore durante la chiamata a ${path}:`, error);
      return 0;
    }
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
