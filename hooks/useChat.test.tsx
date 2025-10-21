import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useChat } from './useChat';
import type { ParsedChatData } from '@/lib/chat-parser';

const parseChatDataMock = vi.fn<[], Promise<ParsedChatData>>();
const appendMock = vi.fn();
let mockMessages: Array<{ id: string; role: 'user' | 'assistant'; content: string }> = [];

vi.mock('ai/react', () => ({
  useChat: () => ({
    messages: mockMessages,
    append: appendMock,
    reload: vi.fn(),
    stop: vi.fn(),
    isLoading: false,
    input: '',
    setInput: vi.fn(),
  }),
}));

vi.mock('@/lib/chat-parser', async () => {
  const actual = await vi.importActual<typeof import('@/lib/chat-parser')>('@/lib/chat-parser');
  return {
    ...actual,
    parseChatData: (...args: Parameters<typeof parseChatDataMock>) => parseChatDataMock(...args),
  };
});

const createFetchMock = () =>
  vi.fn(async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input.toString();
    if (url.includes('/api/assistente')) {
      return {
        ok: true,
        json: async () => ({}),
      };
    }
    if (url.includes('/api/leads')) {
      return {
        ok: true,
        json: async () => ({
          message: 'ok',
          customerId: 'cust-1',
          conversationId: 'conv-1',
        }),
      };
    }
    if (url.includes('/api/bookings')) {
      return {
        ok: true,
        json: async () => ({
          message: 'ok',
          bookingId: 'book-1',
        }),
      };
    }
    return {
      ok: true,
      json: async () => ({}),
    };
  });

describe('useChat', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    mockMessages = [];
    parseChatDataMock.mockReset();
    appendMock.mockReset();
    global.fetch = createFetchMock() as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  const baseParsedData = (): ParsedChatData => ({
    nome: 'Mario Rossi',
    telefono: '3331234567',
    booking_date_time: '2024-08-10T18:30:00.000Z',
    party_size: 2,
    notes: 'Nessuna richiesta',
    intent: 'prenotazione',
    persone: '2',
    orario: '18:30',
    clarifications: [],
  });

  it('aggiorna bookingData quando gli slot arrivano in ordine sparso', async () => {
    mockMessages = [
      { id: 'sys', role: 'assistant', content: 'Ciao!' },
      {
        id: 'user-1',
        role: 'user',
        content: 'Ciao, mi chiamo Mario Rossi e il mio numero è 3331234567. Prenoto per il 10 agosto alle 18:30 per due persone.',
      },
    ];
    parseChatDataMock.mockResolvedValueOnce(baseParsedData());

    const { result } = renderHook(() => useChat());

    await waitFor(() => {
      expect(result.current.bookingData.nome).toBeTruthy();
    });

    expect(result.current.bookingData.nome).toContain('Mario Rossi');
    expect(result.current.bookingData.telefono).toBe('3331234567');
    expect(result.current.bookingData.partySize).toBe(2);
  });

  it('mantiene summary bloccato quando il parser segnala chiarimenti', async () => {
    mockMessages = [
      { id: 'sys', role: 'assistant', content: 'Ciao!' },
      { id: 'user-1', role: 'user', content: 'Vorrei prenotare stasera verso le nove.' },
    ];

    parseChatDataMock.mockResolvedValueOnce({
      ...baseParsedData(),
      booking_date_time: undefined,
      orario: undefined,
      clarifications: [
        {
          slot: 'data',
          reason: 'Data indicata in modo generico, chiedi conferma.',
        },
        {
          slot: 'orario',
          reason: "Orario generico, richiedi l'orario preciso.",
        },
      ],
    });

    const { result } = renderHook(() => useChat());

    await waitFor(() => {
      expect(result.current.clarifications?.length).toBeGreaterThan(0);
    });

    expect(result.current.summaryReady).toBe(false);
    expect(result.current.missingSteps).toContain('data');
    expect(result.current.missingSteps).toContain('orario');
  });

  it('sblocca summaryReady dopo che il chiarimento è risolto', async () => {
    const firstParse: ParsedChatData = {
      ...baseParsedData(),
      booking_date_time: undefined,
      orario: undefined,
      clarifications: [
        { slot: 'orario', reason: 'Serve un orario preciso' },
      ],
    };
    const secondParse: ParsedChatData = baseParsedData();

    mockMessages = [
      { id: 'sys', role: 'assistant', content: 'Ciao!' },
      { id: 'user-1', role: 'user', content: 'Vorrei prenotare stasera verso le nove.' },
    ];

    parseChatDataMock.mockResolvedValueOnce(firstParse);
    parseChatDataMock.mockResolvedValueOnce(secondParse);

    const { result, rerender } = renderHook(() => useChat());

    await waitFor(() => {
      expect(result.current.clarifications?.length).toBeGreaterThan(0);
    });

    expect(result.current.summaryReady).toBe(false);

    act(() => {
      mockMessages = [
        ...mockMessages,
        { id: 'user-2', role: 'user', content: 'Perfetto, confermo per il 10 agosto alle 18:30.' },
      ];
      rerender();
    });

    await waitFor(() => {
      expect(result.current.summaryReady).toBe(true);
    });
    expect(result.current.missingSteps).toEqual([]);
  });

  it('invia automaticamente lead e booking con conferma testuale affidabile', async () => {
    mockMessages = [
      { id: 'sys', role: 'assistant', content: 'Ciao!' },
      { id: 'user-1', role: 'user', content: 'Ok procedi' },
    ];
    parseChatDataMock.mockResolvedValueOnce(baseParsedData());

    const fetchMock = global.fetch as unknown as vi.Mock;

    renderHook(() => useChat());

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/leads', expect.anything());
    });
    expect(fetchMock).toHaveBeenCalledWith('/api/bookings', expect.anything());
  });

  it('non auto-conferma quando il messaggio contiene richieste aggiuntive', async () => {
    mockMessages = [
      { id: 'sys', role: 'assistant', content: 'Ciao!' },
      { id: 'user-1', role: 'user', content: 'Si, ma possiamo fare alle 21?' },
    ];
    parseChatDataMock.mockResolvedValueOnce(baseParsedData());

    const fetchMock = global.fetch as unknown as vi.Mock;

    renderHook(() => useChat());

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });

    const leadCalls = fetchMock.mock.calls.filter(
      ([url]) => typeof url === 'string' && url.includes('/api/leads')
    );
    expect(leadCalls.length).toBe(0);
  });

  it('marca lo slot nome come completo quando il cognome viene fornito e il chiarimento si risolve', async () => {
    const firstParse: ParsedChatData = {
      ...baseParsedData(),
      nome: 'Nikita',
      clarifications: [
        {
          slot: 'nome',
          reason: 'Il cognome è mancante, chiedi di confermarlo.',
        },
      ],
    };

    const secondParse: ParsedChatData = {
      ...baseParsedData(),
      nome: 'Nikita Guarducci',
      clarifications: [],
    };

    parseChatDataMock
      .mockResolvedValueOnce(firstParse)
      .mockResolvedValueOnce(secondParse);

    mockMessages = [
      { id: 'sys', role: 'assistant', content: 'Ciao!' },
      { id: 'user-1', role: 'user', content: 'Sono Nikita.' },
    ];

    const { result, rerender } = renderHook(() => useChat());

    await waitFor(() => {
      expect(result.current.slotState.nome.value).toBe('Nikita');
      expect(result.current.slotState.nome.needsClarification).toBe(true);
    });

    act(() => {
      mockMessages = [
        ...mockMessages,
        { id: 'assistant-1', role: 'assistant', content: 'Mi confermi il cognome?' },
        { id: 'user-2', role: 'user', content: 'Certo, Nikita Guarducci.' },
      ];
      rerender();
    });

    await waitFor(() => {
      expect(result.current.slotState.nome.value).toBe('Nikita Guarducci');
      expect(result.current.slotState.nome.needsClarification).toBe(false);
    });

    expect(result.current.missingSteps).not.toContain('nome');
    expect(result.current.summaryReady).toBe(true);
  });
});
