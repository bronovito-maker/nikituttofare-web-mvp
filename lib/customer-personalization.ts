type RawRecord = Record<string, any>;

export type CustomerPersonalization = {
  customerId: number;
  fullName?: string;
  phoneNumber?: string;
  email?: string;
  totalBookings: number;
  lastBooking?: {
    bookingId: number;
    bookingDateTime: string;
    partySize: number | null;
    notes?: string | null;
  };
  favoritePartySize?: number | null;
  preferredTimes?: string[];
};

const sanitizeWhereValue = (value: string) => value.replaceAll('~', '').replaceAll('(', '').replaceAll(')', '');

const toTimeKey = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
};

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minuti
const personalizationCache = new Map<
  string,
  { data: CustomerPersonalization | null; expiresAt: number }
>();

export async function fetchCustomerPersonalization(
  tenantId: number,
  email?: string
): Promise<CustomerPersonalization | null> {
  // TODO: Replace this with Supabase logic
  if (!email || !tenantId) {
    return null;
  }

  const mockPersonalization: CustomerPersonalization = {
    customerId: 1,
    fullName: 'Mario Rossi (Mock)',
    phoneNumber: '0987654321',
    email: email,
    totalBookings: 5,
    lastBooking: {
      bookingId: 123,
      bookingDateTime: new Date().toISOString(),
      partySize: 2,
      notes: 'Nessuna nota',
    },
    favoritePartySize: 2,
    preferredTimes: ['20:00', '20:30'],
  };

  return mockPersonalization;
}
