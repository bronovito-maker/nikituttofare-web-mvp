// lib/noco-helpers.ts
import { noco } from '@/lib/noco'; // Importa la NUOVA istanza client
import {
  NC_TABLE_BOOKINGS_ID,
  NC_VIEW_BOOKINGS_ID,
  NC_TABLE_CUSTOMERS_ID,
  NC_VIEW_CUSTOMERS_ID,
} from '@/lib/noco-ids';
import type { Booking, Customer } from '@/lib/types';
// @ts-ignore: nocodb-sdk non esiste più, ma manteniamo il tipo Filter per compatibilità
import type { lib as nocoLib } from 'nocodb-sdk';

// @ts-ignore
type Filter = nocoLib.Filterv1;

type NocoParams = {
  where?: string;
  limit?: number;
  sort?: string;
  offset?: number;
};

export async function listViewRowsById(
  tableId: string,
  viewId: string,
  params: NocoParams = {}
) {
  console.log('[NocoDBG_v2] listView →', { tableId, viewId, params });

  if (!tableId || !viewId) {
    throw new Error(`ID tabella (${tableId}) o ID vista (${viewId}) mancanti.`);
  }

  const payload: NocoParams = {
    ...params,
  };

  try {
    const raw = (await noco.listView(tableId, viewId, payload)) as {
      list?: unknown;
      pageInfo?: ListViewResult<unknown>['pageInfo'];
    };

    if (raw) {
      const list = Array.isArray(raw.list)
        ? raw.list
        : raw.list !== undefined && raw.list !== null
        ? [raw.list]
        : [];

      const pageInfo: ListViewResult<unknown>['pageInfo'] = raw.pageInfo ?? {
        totalRows: list.length,
        page: 1,
        pageSize: list.length,
      };

      if (typeof pageInfo.totalRows !== 'number') {
        console.warn(
          `[NocoHelper] pageInfo.totalRows assente per ${tableId}. Stimiamo da list.length.`
        );
        pageInfo.totalRows = list.length;
      }

      return {
        list,
        pageInfo,
      };
    }

    console.error(
      `[NocoHelper] listViewRowsById ha ricevuto risultato invalido da noco.listView per ${tableId}:`,
      raw
    );
    return { list: [], pageInfo: { totalRows: 0, page: 1, pageSize: 0 } };
  } catch (error) {
    console.error(
      `Errore NocoDB [listViewRowsById] sulla vista ${viewId} (Tabella: ${tableId}):`,
      error
    );
    throw error;
  }
}

type ListViewResult<T> = {
  list: T[];
  pageInfo: {
    totalRows?: number;
    page?: number;
    pageSize?: number;
    isFirstPage?: boolean;
    isLastPage?: boolean;
    [key: string]: unknown;
  };
};

const sanitizeWhereValue = (value: string | number) =>
  String(value).replace(/[()]/g, '').replace(/~/g, '');

const ensureIsoString = (value: Date | string) => {
  if (value instanceof Date) {
    return value.toISOString();
  }

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString();
  }

  return String(value);
};

const normalizeListResult = <T>(raw: any): ListViewResult<T> => {
  return {
    list: (raw?.list ?? []) as T[],
    pageInfo: (raw?.pageInfo ?? {}) as ListViewResult<T>['pageInfo'],
  };
};

export type TenantCustomersOptions = {
  limit?: number;
  offset?: number;
  sort?: string;
  ids?: Array<number | string>;
};

export async function getTenantCustomers(
  tenantId: number,
  options: TenantCustomersOptions = {}
): Promise<ListViewResult<Customer>> {
  if (!tenantId) {
    throw new Error('tenantId mancante per getTenantCustomers');
  }

  if (!NC_TABLE_CUSTOMERS_ID || !NC_VIEW_CUSTOMERS_ID) {
    throw new Error('ID NocoDB mancanti per i clienti');
  }

  const whereParts: string[] = [`(tenant_id,eq,${tenantId})`];

  if (options.ids && options.ids.length > 0) {
    const ids = options.ids
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id));
    if (ids.length > 0) {
      whereParts.push(`(Id,in,${ids.join(',')})`);
    }
  }

  const params: NocoParams = {
    where: whereParts.join('~and'),
    limit: options.limit ?? (options.ids ? options.ids.length : 50),
    offset: options.offset,
    sort: options.sort ?? '-CreatedAt',
  };

  const rawResult = await listViewRowsById(
    NC_TABLE_CUSTOMERS_ID,
    NC_VIEW_CUSTOMERS_ID,
    params
  );

  return normalizeListResult<Customer>(rawResult);
}

export type TenantBookingsOptions = {
  limit?: number;
  offset?: number;
  sort?: string;
  status?: string;
  from?: Date | string;
  to?: Date | string;
};

export async function getTenantBookings(
  tenantId: number,
  options: TenantBookingsOptions = {}
): Promise<ListViewResult<Booking>> {
  if (!tenantId) {
    throw new Error('tenantId mancante per getTenantBookings');
  }

  if (!NC_TABLE_BOOKINGS_ID || !NC_VIEW_BOOKINGS_ID) {
    throw new Error('ID NocoDB mancanti per le prenotazioni');
  }

  const whereParts: string[] = [`(tenant_id,eq,${tenantId})`];

  if (options.status) {
    whereParts.push(`(status,eq,${sanitizeWhereValue(options.status)})`);
  }

  if (options.from) {
    const fromIso = sanitizeWhereValue(ensureIsoString(options.from));
    whereParts.push(`(booking_datetime,ge,${fromIso})`);
  }

  if (options.to) {
    const toIso = sanitizeWhereValue(ensureIsoString(options.to));
    whereParts.push(`(booking_datetime,lt,${toIso})`);
  }

  const params: NocoParams = {
    where: whereParts.join('~and'),
    limit: options.limit ?? 50,
    offset: options.offset,
    sort: options.sort ?? '-booking_datetime',
  };

  const rawResult = await listViewRowsById(
    NC_TABLE_BOOKINGS_ID,
    NC_VIEW_BOOKINGS_ID,
    params
  );

  return normalizeListResult<Booking>(rawResult);
}

export async function getTenantCustomersCount(tenantId: number): Promise<number> {
  if (!tenantId) {
    throw new Error('tenantId mancante per getTenantCustomersCount');
  }

  if (!NC_TABLE_CUSTOMERS_ID) {
    throw new Error('ID NocoDB mancanti per i clienti');
  }

  try {
    return await noco.getRecordCount(NC_TABLE_CUSTOMERS_ID, {
      where: `(tenant_id,eq,${tenantId})`,
    });
  } catch (error) {
    console.error('[NocoHelper] Errore in getTenantCustomersCount:', error);
    return 0;
  }
}

export async function getTenantBookingsCount(tenantId: number): Promise<number> {
  if (!tenantId) {
    throw new Error('tenantId mancante per getTenantBookingsCount');
  }

  if (!NC_TABLE_BOOKINGS_ID) {
    throw new Error('ID NocoDB mancanti per le prenotazioni');
  }

  try {
    return await noco.getRecordCount(NC_TABLE_BOOKINGS_ID, {
      where: `(tenant_id,eq,${tenantId})`,
    });
  } catch (error) {
    console.error('[NocoHelper] Errore in getTenantBookingsCount:', error);
    return 0;
  }
}

const formatDateYYYYMMDD = (date: Date): string => {
  const pad = (value: number) => String(value).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  return `${year}-${month}-${day}`;
};

export async function getRecentBookingsCount(tenantId: number): Promise<number> {
  if (!tenantId) {
    throw new Error('tenantId mancante per getRecentBookingsCount');
  }

  if (!NC_TABLE_BOOKINGS_ID) {
    throw new Error('ID NocoDB mancanti per le prenotazioni');
  }

  const today = new Date();
  const dateStr = formatDateYYYYMMDD(today);

  try {
    return await noco.getRecordCount(NC_TABLE_BOOKINGS_ID, {
      where: `(tenant_id,eq,${tenantId})~and(booking_datetime,date,eq,${dateStr})`,
    });
  } catch (error) {
    console.error('[NocoHelper] Errore in getRecentBookingsCount:', error);
    return 0;
  }
}

export async function getMonthlyBookingsCount(tenantId: number): Promise<number> {
  if (!tenantId) {
    throw new Error('tenantId mancante per getMonthlyBookingsCount');
  }

  if (!NC_TABLE_BOOKINGS_ID) {
    throw new Error('ID NocoDB mancanti per le prenotazioni');
  }

  const today = new Date();
  const startOfMonthStr = formatDateYYYYMMDD(new Date(today.getFullYear(), today.getMonth(), 1));
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const endOfMonthStr = formatDateYYYYMMDD(new Date(nextMonth.getTime() - 1));

  try {
    return await noco.getRecordCount(NC_TABLE_BOOKINGS_ID, {
      where: `(tenant_id,eq,${tenantId})~and(booking_datetime,ge,${startOfMonthStr})~and(booking_datetime,le,${endOfMonthStr})`,
    });
  } catch (error) {
    console.error('[NocoHelper] Errore in getMonthlyBookingsCount:', error);
    return 0;
  }
}

export async function getPendingBookingsCount(tenantId: number): Promise<number> {
  if (!tenantId) {
    throw new Error('tenantId mancante per getPendingBookingsCount');
  }

  if (!NC_TABLE_BOOKINGS_ID) {
    throw new Error('ID NocoDB mancanti per le prenotazioni');
  }

  try {
    return await noco.getRecordCount(NC_TABLE_BOOKINGS_ID, {
      where: `(tenant_id,eq,${tenantId})~and(status,eq,${sanitizeWhereValue('richiesta')})`,
    });
  } catch (error) {
    console.error('[NocoHelper] Errore in getPendingBookingsCount:', error);
    return 0;
  }
}

export async function readTableRowById(
  tableId: string,
  rowId: number | string
) {
  if (process.env.NODE_ENV !== 'production') {
    console.debug('[NocoDBG_v2] readTableRow →', { tableId, rowId });
  }
  if (!tableId || !rowId) {
    throw new Error(`ID tabella (${tableId}) o ID riga (${rowId}) mancanti.`);
  }
  try {
    const result = await noco.readTableRow(tableId, rowId);

    if (result && typeof result === 'object' && !Array.isArray(result)) {
      return result;
    }

    console.warn(
      `[NocoHelper] readTableRowById (riga ${rowId}) ha ricevuto una risposta inattesa o vuota:`,
      result
    );
    return null;
  } catch (error) {
    console.error(`Errore NocoDB [readTableRowById] sulla riga ${rowId} (Tabella: ${tableId}):`, error);
    throw error;
  }
}

export async function createTableRowById(tableId: string, data: Record<string, any>) {
  if (!tableId) {
    throw new Error('ID tabella mancante per createTableRowById');
  }

  if (process.env.NODE_ENV !== 'production') {
    console.debug('[NocoDBG_v2] create →', { tableId, data });
  }

  try {
    // MAPPATO: Usa il nostro nuovo client per creare sulla TABELLA
    return await noco.create(tableId, data);
  } catch (error) {
    console.error(`Errore NocoDB [createTableRowById] sulla tabella ${tableId}:`, error);
    throw error;
  }
}

export async function updateTableRowById(
  tableId: string,
  rowId: number | string,
  data: Record<string, any>
) {
  if (!tableId || !rowId) {
    throw new Error(`Parametri mancanti per updateTableRowById (${tableId}, ${rowId}).`);
  }

  if (process.env.NODE_ENV !== 'production') {
    console.debug('[NocoDBG_v2] update →', { tableId, rowId, data });
  }

  try {
    // MAPPATO: Usa il nostro nuovo client per aggiornare sulla TABELLA
    return await noco.update(tableId, rowId, data);
  } catch (error) {
    console.error(
      `Errore NocoDB [updateTableRowById] sulla tabella ${tableId} (Riga: ${rowId}):`,
      error
    );
    throw error;
  }
}
