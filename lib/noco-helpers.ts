// lib/noco-helpers.ts
import { noco } from '@/lib/noco'; // Importa la NUOVA istanza client
// @ts-ignore: nocodb-sdk non esiste più, ma manteniamo il tipo Filter per compatibilità
import type { lib as nocoLib } from 'nocodb-sdk';

// @ts-ignore
type Filter = nocoLib.Filterv1;

// Non servono più NC_PROJECT_ID e NC_DB_ALIAS per le chiamate
// const PROJECT_ID = ...
// const DB_ALIAS = ...

export async function listViewRowsById(
  tableId: string,
  viewId: string,
  params?: Filter
) {
  if (process.env.NODE_ENV !== 'production') {
    // Log aggiornato per la v2
    console.debug('[NocoDBG_v2] listView →', { tableId, viewId, params });
  }

  if (!tableId || !viewId) {
    throw new Error(`ID tabella (${tableId}) o ID vista (${viewId}) mancanti.`);
  }

  try {
    // MAPPATO: Usa il nostro nuovo client per interrogare la VISTA
    return await noco.listView(tableId, viewId, params as Record<string, any>);
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
    // MAPPATO: Usa il nostro nuovo client per leggere dalla VISTA
    return await noco.readViewRow(tableId, viewId, rowId);
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
