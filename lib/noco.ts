// lib/noco.ts
import 'server-only';

const BASE_URL = (process.env.NOCO_API_URL || '').replace(/\/+$/, '');
const TOKEN = process.env.NOCO_API_TOKEN || '';
if (!BASE_URL || !TOKEN) {
  throw new Error('Definisci NOCO_API_URL e NOCO_API_TOKEN in .env.local');
}

const PROJECT = process.env.NOCO_PROJECT_SLUG || '';
const TABLE_ID_FROM_ENV = process.env.NOCO_TABLE_ID || '';
const TABLE_NAME = process.env.NOCO_TABLE_USERS || '';
const EMAIL_FIELD = process.env.NOCO_USERS_EMAIL_FIELD || 'email';
const VIEW_ID = process.env.NOCO_USERS_VIEW_ID || '';

const tableIdCache = new Map<string, string>();
let nocoClient: any = null;

export function getNocoClient() {
  if (!nocoClient) {
    const { Api } = require('nocodb-sdk');
    if (!Api) {
      throw new Error('Impossibile caricare nocodb-sdk.Api');
    }

    nocoClient = new Api({
      baseURL: BASE_URL,
      secure: true,
      securityWorker: (token: string | null) =>
        token
          ? {
              headers: {
                'xc-token': token,
              },
            }
          : {},
    });
    nocoClient.setSecurityData(TOKEN);
  }

  return nocoClient;
}

async function nocoApi<T = any>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'xc-token': TOKEN,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`NocoDB ${res.status} su ${path}: ${body}`);
  }
  if (res.status === 204) return null as unknown as T;
  return res.json() as Promise<T>;
}

/** Ritorna l'ID tabella v2. Se NOCO_TABLE_ID è già valorizzato, usa quello. */
export async function getTableId(projectIdOrSlug: string, tableName: string): Promise<string> {
  if (
    TABLE_ID_FROM_ENV &&
    (tableName === TABLE_NAME || tableName === TABLE_ID_FROM_ENV)
  ) {
    return TABLE_ID_FROM_ENV;
  }

  const key = `${projectIdOrSlug}:${tableName}`;
  if (tableIdCache.has(key)) return tableIdCache.get(key)!;

  const data = await nocoApi<{ list?: any[]; data?: any[] }>(
    `/api/v2/projects/${encodeURIComponent(projectIdOrSlug)}/tables?limit=1000`
  );
  const tables = data.list || data.data || [];

  const match = tables.find((t: any) =>
    t?.id === tableName || t?.title === tableName || t?.table_name === tableName
  );
  if (!match?.id) {
    throw new Error(`Tabella "${tableName}" non trovata nel progetto "${projectIdOrSlug}".`);
  }
  tableIdCache.set(key, match.id);
  return match.id;
}

/** where in formato v2: (Campo,eq,valore) */
export async function findOneByWhereREST(
  projectIdOrSlug: string,
  tableNameOrId: string,
  where: string,
  options?: { viewId?: string }
) {
  const tableId = /^[a-z0-9]{14,}$/i.test(tableNameOrId)
    ? tableNameOrId
    : await getTableId(projectIdOrSlug, tableNameOrId);

  const viewId = options?.viewId ?? (tableNameOrId === TABLE_NAME ? VIEW_ID || undefined : undefined);
  const viewParam = viewId ? `&viewId=${encodeURIComponent(viewId)}` : '';
  const url = `/api/v2/tables/${encodeURIComponent(
    tableId
  )}/records?where=${encodeURIComponent(where)}&limit=1${viewParam}`;

  const res = await nocoApi<{ list?: any[]; data?: any[] }>(url);
  const rows = res?.list || res?.data || [];
  return Array.isArray(rows) ? rows[0] ?? null : null;
}

type RecordQueryOptions = {
  where?: string;
  sort?: string;
  limit?: number;
  offset?: number;
  viewId?: string;
  fields?: string[];
};

async function resolveTableId(tableNameOrId: string) {
  if (/^[a-z0-9]{10,}$/i.test(tableNameOrId)) {
    return tableNameOrId;
  }
  if (!PROJECT) {
    throw new Error('Manca NOCO_PROJECT_SLUG in .env.local');
  }
  return await getTableId(PROJECT, tableNameOrId);
}

export async function listRecords(tableNameOrId: string, options: RecordQueryOptions = {}) {
  const tableId = await resolveTableId(tableNameOrId);
  const params = new URLSearchParams();
  if (options.where) params.set('where', options.where);
  if (options.sort) params.set('sort', options.sort);
  if (options.limit !== undefined) params.set('limit', String(options.limit));
  if (options.offset !== undefined) params.set('offset', String(options.offset));
  if (options.fields?.length) params.set('fields', options.fields.join(','));
  const effectiveView = options.viewId ?? (tableNameOrId === TABLE_NAME ? VIEW_ID || undefined : undefined);
  if (effectiveView) params.set('viewId', effectiveView);

  const queryString = params.toString();
  const url = `/api/v2/tables/${encodeURIComponent(tableId)}/records${queryString ? `?${queryString}` : ''}`;
  const res = await nocoApi<{ list?: any[]; data?: any[] }>(url);
  return res?.list || res?.data || [];
}

const normalizeApiResult = (input: any) => {
  if (!input) return null;
  if (Array.isArray(input)) return input[0] ?? null;
  if (Array.isArray(input.records)) return input.records[0] ?? null;
  if (Array.isArray(input.list)) return input.list[0] ?? null;
  if (input.record) return input.record;
  return input;
};

export async function createRecord(
  tableNameOrId: string,
  data: Record<string, any> | Record<string, any>[],
  options: { viewId?: string } = {}
) {
  const tableId = await resolveTableId(tableNameOrId);
  const params = new URLSearchParams();
  const effectiveView = options.viewId ?? (tableNameOrId === TABLE_NAME ? VIEW_ID || undefined : undefined);
  if (effectiveView) params.set('viewId', effectiveView);
  const payload = Array.isArray(data) ? data : [data];

  return await nocoApi(`/api/v2/tables/${encodeURIComponent(tableId)}/records${params.toString() ? `?${params}` : ''}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getRecordById(
  tableNameOrId: string,
  rowId: string | number,
  options: { viewId?: string } = {}
) {
  const tableId = await resolveTableId(tableNameOrId);
  const params = new URLSearchParams();
  const effectiveView = options.viewId ?? (tableNameOrId === TABLE_NAME ? VIEW_ID || undefined : undefined);
  if (effectiveView) params.set('viewId', effectiveView);
  const url = `/api/v2/tables/${encodeURIComponent(tableId)}/records/${encodeURIComponent(
    String(rowId)
  )}${params.toString() ? `?${params}` : ''}`;
  return await nocoApi(url);
}

export async function updateRecord(
  tableNameOrId: string,
  rowId: string | number,
  data: Record<string, any>,
  options: { viewId?: string } = {}
) {
  const tableId = await resolveTableId(tableNameOrId);
  const params = new URLSearchParams();
  const effectiveView = options.viewId ?? (tableNameOrId === TABLE_NAME ? VIEW_ID || undefined : undefined);
  if (effectiveView) params.set('viewId', effectiveView);
  const payload = [{ Id: rowId, ...data }];

  return await nocoApi(`/api/v2/tables/${encodeURIComponent(tableId)}/records${params.toString() ? `?${params}` : ''}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function extractSingleRecord<T = any>(input: any): T | null {
  return normalizeApiResult(input);
}

export async function getUserByEmail(email: string) {
  if (!PROJECT) throw new Error('Manca NOCO_PROJECT_SLUG in .env.local');
  const tableKey = TABLE_ID_FROM_ENV || TABLE_NAME;
  if (!tableKey) throw new Error('Definisci NOCO_TABLE_ID o NOCO_TABLE_USERS in .env.local');

  const where = `(${EMAIL_FIELD},eq,${email})`;
  return await findOneByWhereREST(PROJECT, tableKey, where, { viewId: VIEW_ID || undefined });
}
