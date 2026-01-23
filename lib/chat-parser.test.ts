import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest';
import { parseChatData } from './chat-parser';
import type { Message } from './types';

const createResponse = (data: unknown) => ({
  ok: true,
  json: async () => data,
});

describe('parseChatData', () => {
  const originalFetch = global.fetch;
  let fetchMock: Mock<[RequestInfo | URL, RequestInit?], Promise<unknown>>;

  beforeEach(() => {
    fetchMock = vi.fn<[RequestInfo | URL, RequestInit?], Promise<unknown>>();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    fetchMock.mockReset();
  });

  it('falls back to heuristics when NLU request fails', async () => {
    fetchMock.mockRejectedValueOnce(new Error('network error'));

    const messages: Message[] = [
      {
        id: '1',
        role: 'user',
        content: 'Vorrei prenotare, mi chiamo Luca e il mio numero è 3331234567',
      },
    ];

    const result = await parseChatData(messages);

    expect(result.telefono).toBe('3331234567');
    expect(result.intent).toBe('prenotazione');
    expect(result.party_size).toBeUndefined();
  });

  it('extracts multi-word name correctly using heuristics', async () => {
    fetchMock.mockRejectedValueOnce(new Error('network error'));

    const messages: Message[] = [
      {
        id: '1',
        role: 'user',
        content: 'Mi chiamo Mario Rossi',
      },
    ];

    const result = await parseChatData(messages);
    expect(result.nome).toBe('Mario Rossi');
  });

  it('extracts email correctly using heuristics', async () => {
    fetchMock.mockRejectedValueOnce(new Error('network error'));

    const messages: Message[] = [
      {
        id: '1',
        role: 'user',
        content: 'La mia mail è test.user@example.co.uk',
      },
    ];

    const result = await parseChatData(messages);
    expect(result.email).toBe('test.user@example.co.uk');
  });

  it('keeps high confidence heuristic values when NLU result is partial', async () => {
    fetchMock.mockResolvedValueOnce(
      createResponse({
        data: {
          intent: 'prenotazione',
          nome: 'Luca',
          nome_is_ambiguous: false,
          telefono: '33',
          telefono_is_ambiguous: true,
          booking_date_time: null,
          booking_date_time_is_ambiguous: true,
          orario: null,
          orario_is_ambiguous: true,
          party_size: null,
          party_size_is_ambiguous: false,
          notes: null,
        },
      })
    );

    const messages: Message[] = [
      {
        id: '1',
        role: 'user',
        content: 'Mi chiamo Luca e il mio numero è 3331234567. Prenoto per il 12/08.',
      },
    ];

    const result = await parseChatData(messages);

    expect(result.telefono).toBe('3331234567'); // heuristica ad alta confidenza
    expect(result.clarifications?.some((clar) => clar.slot === 'data')).toBeTruthy();
  });

  it('derives clarifications from NLU ambiguities', async () => {
    fetchMock.mockResolvedValueOnce(
      createResponse({
        data: {
          intent: 'prenotazione',
          nome: 'Marco',
          nome_is_ambiguous: false,
          telefono: '+393331234567',
          telefono_is_ambiguous: false,
          booking_date_time: null,
          booking_date_time_is_ambiguous: true,
          orario: null,
          orario_is_ambiguous: true,
          party_size: 2,
          party_size_is_ambiguous: false,
          notes: 'Nessuna richiesta',
        },
      })
    );

    const messages: Message[] = [
      {
        id: '1',
        role: 'user',
        content: 'Ciao sono Marco, possiamo venire stasera verso le nove? Siamo in due.',
      },
    ];

    const result = await parseChatData(messages);

    expect(result.clarifications).toBeDefined();
    expect(result.clarifications).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ slot: 'data' }),
        expect.objectContaining({ slot: 'orario' }),
      ])
    );
    expect(result.party_size).toBe(2);
  });
});
