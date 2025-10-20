import { listViewRowsById } from '@/lib/noco-helpers';
import {
  NC_TABLE_CUSTOMERS_ID,
  NC_VIEW_CUSTOMERS_ID,
  NC_TABLE_BOOKINGS_ID,
  NC_VIEW_BOOKINGS_ID,
} from '@/lib/noco-ids';

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

const sanitizeWhereValue = (value: string) => value.replace(/~/g, '').replace(/\(/g, '').replace(/\)/g, '');

const toTimeKey = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
};

export async function fetchCustomerPersonalization(
  tenantId: number,
  email?: string
): Promise<CustomerPersonalization | null> {
  if (!email || !tenantId) {
    return null;
  }

  const emailValue = sanitizeWhereValue(email.trim().toLowerCase());
  if (!emailValue) return null;

  const customerResult = await listViewRowsById(NC_TABLE_CUSTOMERS_ID, NC_VIEW_CUSTOMERS_ID, {
    where: `(tenant_id,eq,${tenantId})~and((email,eq,${emailValue}))`,
    limit: 1,
  });

  const customerRecord = (customerResult.list as RawRecord[])[0];
  if (!customerRecord) {
    return null;
  }

  const customerId = Number(customerRecord.Id);
  if (!Number.isFinite(customerId)) {
    return null;
  }

  const bookingsResult = await listViewRowsById(NC_TABLE_BOOKINGS_ID, NC_VIEW_BOOKINGS_ID, {
    where: `(tenant_id,eq,${tenantId})~and((customer_id,eq,${customerId}))`,
    sort: '-booking_datetime',
    limit: 10,
  });

  const bookings = (bookingsResult.list as RawRecord[]) ?? [];
  const totalBookings = Number(bookingsResult.pageInfo?.totalRows ?? bookings.length) || bookings.length;

  const lastBookingRecord = bookings[0];

  let favoritePartySize: number | null = null;
  const partySizeCounts = new Map<number, number>();
  const timeCounts = new Map<string, number>();

  bookings.forEach((booking) => {
    const partySize = Number(booking.party_size);
    if (Number.isFinite(partySize) && partySize > 0) {
      partySizeCounts.set(partySize, (partySizeCounts.get(partySize) ?? 0) + 1);
    }

    const bookingIso = booking.booking_datetime as string | undefined;
    if (bookingIso) {
      const timeKey = toTimeKey(bookingIso);
      if (timeKey) {
        timeCounts.set(timeKey, (timeCounts.get(timeKey) ?? 0) + 1);
      }
    }
  });

  if (partySizeCounts.size > 0) {
    favoritePartySize = [...partySizeCounts.entries()].sort((a, b) => b[1] - a[1])[0][0];
  }

  const preferredTimes =
    timeCounts.size > 0
      ? [...timeCounts.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([time]) => time)
      : undefined;

  return {
    customerId,
    fullName: customerRecord.full_name as string | undefined,
    phoneNumber: customerRecord.phone_number as string | undefined,
    email: customerRecord.email as string | undefined,
    totalBookings,
    lastBooking: lastBookingRecord
      ? {
          bookingId: Number(lastBookingRecord.Id),
          bookingDateTime: String(lastBookingRecord.booking_datetime),
          partySize: Number(lastBookingRecord.party_size) || null,
          notes: (lastBookingRecord.notes as string) ?? null,
        }
      : undefined,
    favoritePartySize,
    preferredTimes,
  };
}
