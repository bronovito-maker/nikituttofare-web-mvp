// lib/noco-helpers.ts
import { noco } from '@/lib/noco';
import type { lib as nocoLib } from 'nocodb-sdk';

const PROJECT_ID = process.env.NOCO_PROJECT_ID!;
const DB_ALIAS = process.env.NOCO_DB_ALIAS!;

if (!PROJECT_ID || !DB_ALIAS) {
  throw new Error('NOCO_PROJECT_ID o NOCO_DB_ALIAS non impostati in .env.local');
}

// @ts-ignore: nocodb-sdk non espone direttamente il tipo Filterv1
type Filter = nocoLib.Filterv1;

export async function listViewRowsById(
  tableId: string,
  viewId: string,
  params?: Filter
) {
  if (process.env.NODE_ENV !== 'production') {
    console.debug('[NocoDBG] listViewRowsById →', { DB_ALIAS, PROJECT_ID, tableId, viewId, params });
  }

  if (!tableId || !viewId) {
    throw new Error(`ID tabella (${tableId}) o ID vista (${viewId}) mancanti.`);
  }

  try {
    return await (noco.dbViewRow as any).list(DB_ALIAS, PROJECT_ID, tableId, viewId, params);
  } catch (error) {
    console.error(
      `Errore NocoDB [listViewRowsById] sulla vista ${viewId} (Tabella: ${tableId}):`,
      error
    );
    throw error;
  }
}

export async function createTableRowById(tableId: string, data: Record<string, any>) {
  if (!tableId) {
    throw new Error('ID tabella mancante per createTableRowById');
  }

  if (process.env.NODE_ENV !== 'production') {
    console.debug('[NocoDBG] createTableRowById →', { DB_ALIAS, PROJECT_ID, tableId, data });
  }

  try {
    return await (noco.dbTableRow as any).create(DB_ALIAS, PROJECT_ID, tableId, data);
  } catch (error) {
    console.error(`Errore NocoDB [createTableRowById] sulla tabella ${tableId}:`, error);
    throw error;
  }
}
