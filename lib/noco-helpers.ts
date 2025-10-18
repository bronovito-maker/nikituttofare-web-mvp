// lib/noco-helpers.ts
import { noco } from '@/lib/noco'; // Importa la NUOVA istanza client
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
    const result = await noco.listView(tableId, viewId, payload);

    if (result && typeof result === 'object' && 'list' in result) {
      return {
        list: (result as any).list ?? [],
        pageInfo: (result as any).pageInfo ?? { totalRows: 0, page: 1, pageSize: 0 },
      };
    }

    console.warn('[NocoHelper] listViewRowsById ha ricevuto una risposta inattesa:', result);
    return { list: [], pageInfo: { totalRows: 0, page: 1, pageSize: 0 } };
  } catch (error) {
    console.error(
      `Errore NocoDB [listViewRowsById] sulla vista ${viewId} (Tabella: ${tableId}):`,
      error
    );
    throw error;
  }
}

export async function readTableRowById(
  tableId: string,
  viewId: string,
  rowId: number | string
) {
  if (process.env.NODE_ENV !== 'production') {
    console.debug('[NocoDBG_v2] readViewRow →', { tableId, viewId, rowId });
  }
  if (!tableId || !viewId || !rowId) {
    throw new Error(`ID tabella (${tableId}), ID vista (${viewId}) o ID riga (${rowId}) mancanti.`);
  }
  try {
    const result = await noco.readViewRow(tableId, viewId, rowId);

    if (Array.isArray(result) && result.length > 0) {
      return result[0];
    }

    console.warn(
      `[NocoHelper] readTableRowById (riga ${rowId}) ha ricevuto una risposta inattesa:`,
      result
    );
    return null;
  } catch (error) {
    console.error(`Errore NocoDB [readTableRowById] sulla riga ${rowId} (Vista: ${viewId}):`, error);
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
