import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import { fmtHour, isWeekend, parseISO, toISO, todayISO } from './format';

// ---------- Types ----------

export type SlotKey = 'full' | 'first' | 'second' | 'early';
export type SegmentKey = 'early' | 'late' | 'evening';
export type DateType = 'muhurtham' | 'valarpirai' | 'special' | 'holiday';
export type Category =
  | 'muhurthamWeekend'
  | 'muhurtham'
  | 'special'
  | 'valarpirai'
  | 'weekend'
  | 'weekday';
export type BookingStatus = 'confirmed' | 'tentative' | 'enquiry' | 'cancelled';

export type Segment = { key: SegmentKey; label: string; start: string; end: string };
export type Customer = { id: string; name: string; phone: string };
export type Payment = {
  id: string;
  amount: number;
  date: string;
  mode: string;
  reference?: string;
  notes?: string;
};
export type PaymentInput = Omit<Payment, 'id'>;
export type Booking = {
  id: string;
  number: string;
  date: string;
  slot: SlotKey;
  eventType: string;
  customerId: string;
  brideName?: string;
  groomName?: string;
  guests?: string;
  notes?: string;
  /** Price split as entered on the booking form (total = nonGst + gst + 18% of gst). */
  nonGstAmount?: number;
  gstAmount?: number;
  priceReason?: string;
  total: number;
  status: BookingStatus;
  bookedOn: string;
  payments: Payment[];
};
export type ImportantDate = { id: string; date: string; type: DateType; title?: string };

export const SLOT_LABEL: Record<SlotKey, string> = {
  full: 'Full Day',
  first: 'First Half',
  second: 'Second Half',
  early: 'Early Morning',
};
export const SLOT_ORDER: SlotKey[] = ['full', 'first', 'second', 'early'];

/** Which day segments each booking slot occupies. */
export const SLOT_SEGMENTS: Record<SlotKey, SegmentKey[]> = {
  full: ['early', 'late', 'evening'],
  first: ['early', 'late'],
  second: ['evening'],
  early: ['early'],
};

export const CATEGORY_LABEL: Record<Category, string> = {
  muhurthamWeekend: 'Muhurtham + Weekend',
  muhurtham: 'Muhurtham',
  special: 'Special',
  valarpirai: 'Valarpirai',
  weekend: 'Weekend',
  weekday: 'Weekday',
};
export const CATEGORY_ORDER: Category[] = [
  'muhurthamWeekend',
  'muhurtham',
  'special',
  'valarpirai',
  'weekend',
  'weekday',
];

export const GST_RATE = 0.18;
export const totalFromSplit = (nonGst: number, gst: number) => nonGst + gst + Math.round(gst * GST_RATE);

export const DATE_TYPE_META: Record<DateType, { label: string; symbol: string }> = {
  muhurtham: { label: 'Muhurtham', symbol: '✦' },
  valarpirai: { label: 'Valarpirai', symbol: '◆' },
  special: { label: 'Special', symbol: '●' },
  holiday: { label: 'Holiday', symbol: '■' },
};

export const DEFAULT_EVENT_TYPES = [
  'Wedding',
  'Engagement',
  'Party',
  'Family Function',
  'Reception',
  'Company Function',
];

// ---------- Mock data ----------

const FULL_RATES: Record<Category, number> = {
  muhurthamWeekend: 175000,
  muhurtham: 150000,
  special: 125000,
  valarpirai: 110000,
  weekend: 100000,
  weekday: 80000,
};

/** A slot rate as entered: amount billed without GST plus the amount GST applies to. */
export type RateSplit = { nonGst: number; gst: number };
export const rateTotal = (r: RateSplit) => totalFromSplit(r.nonGst, r.gst);

function scaleRates(f: number): Record<Category, RateSplit> {
  const out = {} as Record<Category, RateSplit>;
  for (const k of CATEGORY_ORDER) out[k] = { nonGst: Math.round((FULL_RATES[k] * f) / 1000) * 1000, gst: 0 };
  return out;
}

const INITIAL_RATES: Record<SlotKey, Record<Category, RateSplit>> = {
  full: scaleRates(1),
  first: scaleRates(0.65),
  second: scaleRates(0.55),
  early: scaleRates(0.4),
};

/**
 * Demo lunar calendar: valarpirai = 15 waxing days after each new moon,
 * plus a few muhurtham / special days. Anchored on a Sep 2026 new moon.
 */
function generateImportantDates(year: number): ImportantDate[] {
  const out: ImportantDate[] = [];
  const anchor = new Date(2026, 8, 11).getTime();
  const cycle = 29.53 * 86400000;
  const start = new Date(year, 0, 1).getTime();
  const end = new Date(year, 11, 31).getTime();
  let n = Math.floor((start - anchor) / cycle) - 1;
  for (; ; n++) {
    const nm = new Date(anchor + n * cycle);
    nm.setHours(0, 0, 0, 0);
    if (nm.getTime() > end + 86400000 * 20) break;
    const add = (offset: number, type: DateType) => {
      const d = new Date(nm);
      d.setDate(d.getDate() + offset);
      if (d.getFullYear() === year) {
        const iso = toISO(d);
        out.push({ id: `${type}-${iso}`, date: iso, type });
      }
    };
    for (let i = 1; i <= 15; i++) add(i, 'valarpirai');
    add(-4, 'muhurtham');
    add(2, 'muhurtham');
    add(6, 'muhurtham');
    add(10, 'special');
  }
  return out;
}

const INITIAL_CUSTOMERS: Customer[] = [
  { id: 'c1', name: 'Arun Kumar', phone: '9000011111' },
  { id: 'c2', name: 'Divya Suresh', phone: '9000022222' },
  { id: 'c3', name: 'Meena Ravi', phone: '9000033333' },
  { id: 'c4', name: 'Karthik Raja', phone: '9000044444' },
];

const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 'b1', number: 'HB-2026-0001', date: '2026-09-24', slot: 'full', eventType: 'Wedding',
    customerId: 'c3', total: 150000, status: 'confirmed', bookedOn: '2026-09-02', payments: [],
  },
  {
    id: 'b2', number: 'HB-2026-0002', date: '2026-09-16', slot: 'second', eventType: 'Reception',
    customerId: 'c3', total: 104500, status: 'confirmed', bookedOn: '2026-09-03',
    payments: [{ id: 'p1', amount: 25000, date: '2026-09-03', mode: 'Cash' }],
  },
  {
    id: 'b3', number: 'HB-2026-0003', date: '2026-09-10', slot: 'early', eventType: 'Engagement',
    customerId: 'c3', total: 54500, status: 'confirmed', bookedOn: '2026-09-03',
    payments: [{ id: 'p2', amount: 10000, date: '2026-09-03', mode: 'UPI' }],
  },
  {
    id: 'b4', number: 'HB-2026-0004', date: '2026-09-09', slot: 'full', eventType: 'Wedding',
    customerId: 'c3', total: 80000, status: 'cancelled', bookedOn: '2026-09-03', payments: [],
  },
  {
    id: 'b5', number: 'HB-2026-0005', date: '2026-09-17', slot: 'first', eventType: 'Wedding',
    customerId: 'c1', total: 150000, status: 'confirmed', bookedOn: '2026-09-05',
    payments: [{ id: 'p3', amount: 50000, date: '2026-09-05', mode: 'Bank transfer' }],
  },
  {
    id: 'b6', number: 'HB-2026-0006', date: '2026-10-04', slot: 'second', eventType: 'Party',
    customerId: 'c2', total: 60000, status: 'tentative', bookedOn: '2026-09-12', payments: [],
  },
  {
    id: 'b7', number: 'HB-2026-0007', date: '2026-10-15', slot: 'full', eventType: 'Wedding',
    customerId: 'c1', total: 150000, status: 'confirmed', bookedOn: '2026-09-15',
    payments: [{ id: 'p4', amount: 150000, date: '2026-09-15', mode: 'UPI' }],
  },
  {
    id: 'b8', number: 'HB-2026-0008', date: '2026-10-22', slot: 'early', eventType: 'Engagement',
    customerId: 'c4', total: 65000, status: 'confirmed', bookedOn: '2026-09-18',
    payments: [{ id: 'p5', amount: 20000, date: '2026-09-18', mode: 'UPI' }],
  },
  {
    id: 'b9', number: 'HB-2026-0009', date: '2026-11-06', slot: 'second', eventType: 'Reception',
    customerId: 'c2', total: 110000, status: 'confirmed', bookedOn: '2026-09-20', payments: [],
  },
];

// ---------- Helpers ----------

export const paidOf = (b: Booking) => b.payments.reduce((s, p) => s + p.amount, 0);
export const balanceOf = (b: Booking) => b.total - paidOf(b);

export type PayState = 'paid' | 'due' | 'unpaid' | 'cancelled';
export function payState(b: Booking): PayState {
  if (b.status === 'cancelled') return 'cancelled';
  if (balanceOf(b) <= 0) return 'paid';
  return paidOf(b) === 0 ? 'unpaid' : 'due';
}

export type SegState = 'free' | 'booked' | 'tentative' | 'blocked';

export function slotTime(slot: SlotKey, segs: Segment[]) {
  const g = (k: SegmentKey) => segs.find((s) => s.key === k)!;
  switch (slot) {
    case 'full':
      return `${fmtHour(g('evening').start)} – ${fmtHour(g('evening').start)} next day`;
    case 'first':
      return `${fmtHour(g('late').start)} – ${fmtHour(g('late').end)}`;
    case 'second':
      return `${fmtHour(g('evening').start)} – ${fmtHour(g('evening').end)}`;
    case 'early':
      return `${fmtHour(g('early').start)} – ${fmtHour(g('early').end)}`;
  }
}

// ---------- Store ----------

export type Hall = {
  name: string;
  org: string;
  role: string;
  address: string;
  phone: string;
  capacity: string;
};

type Store = {
  hall: Hall;
  customers: Customer[];
  bookings: Booking[];
  importantDates: ImportantDate[];
  blockedDays: string[];
  segments: Segment[];
  rates: Record<SlotKey, Record<Category, RateSplit>>;
  eventTypes: string[];
  signedIn: boolean;

  typesFor: (iso: string) => DateType[];
  categoryFor: (iso: string) => Category;
  /** Suggested total (GST included) for a date + slot. */
  priceFor: (iso: string, slot: SlotKey) => number;
  rateFor: (iso: string, slot: SlotKey) => RateSplit;
  /** Occupancy of the three day segments. `excludeId` ignores one booking (used while editing it). */
  segmentState: (iso: string, excludeId?: string) => Record<SegmentKey, SegState>;
  customerById: (id: string) => Customer | undefined;
  bookingsOn: (iso: string) => Booking[];
  monthSummary: (y: number, m: number) => { count: number; revenue: number; received: number; due: number };

  addCustomer: (c: Omit<Customer, 'id'>) => Customer;
  addBooking: (b: Omit<Booking, 'id' | 'number' | 'bookedOn' | 'payments'> & { advance?: number }) => Booking;
  addPayment: (bookingId: string, p: PaymentInput) => void;
  updateBooking: (id: string, patch: Partial<Omit<Booking, 'id' | 'number' | 'bookedOn' | 'payments'>>) => void;
  cancelBooking: (bookingId: string) => void;
  toggleBlock: (iso: string) => void;
  addImportantDate: (date: string, type: DateType, title?: string) => void;
  removeImportantDate: (id: string) => void;
  updateSegment: (key: SegmentKey, start: string, end: string) => void;
  updateRate: (slot: SlotKey, cat: Category, value: RateSplit) => void;
  addEventType: (t: string) => void;
  setSignedIn: (v: boolean) => void;
};

const Ctx = createContext<Store | null>(null);

let seq = 100;
const uid = (p: string) => `${p}${++seq}`;

export function StoreProvider({ children }: { children: ReactNode }) {
  const [customers, setCustomers] = useState(INITIAL_CUSTOMERS);
  const [bookings, setBookings] = useState(INITIAL_BOOKINGS);
  const [importantDates, setImportantDates] = useState<ImportantDate[]>(() => [
    ...generateImportantDates(2026),
    ...generateImportantDates(2027),
  ]);
  const [blockedDays, setBlockedDays] = useState<string[]>([]);
  const [segments, setSegments] = useState<Segment[]>([
    { key: 'early', label: 'Early Morning', start: '06:00', end: '11:00' },
    { key: 'late', label: 'Late Morning', start: '06:00', end: '15:00' },
    { key: 'evening', label: 'Evening', start: '15:00', end: '23:59' },
  ]);
  const [rates, setRates] = useState(INITIAL_RATES);
  const [eventTypes, setEventTypes] = useState(DEFAULT_EVENT_TYPES);
  // Every launch opens on the welcome intro; sign-in is local-only and not persisted.
  const [signedIn, setSignedIn] = useState(false);

  const value = useMemo<Store>(() => {
    const typeMap = new Map<string, DateType[]>();
    for (const d of importantDates) {
      const arr = typeMap.get(d.date) ?? [];
      if (!arr.includes(d.type)) arr.push(d.type);
      typeMap.set(d.date, arr);
    }
    const typesFor = (iso: string) => typeMap.get(iso) ?? [];
    const categoryFor = (iso: string): Category => {
      const t = typesFor(iso);
      const wk = isWeekend(iso);
      if (t.includes('muhurtham')) return wk ? 'muhurthamWeekend' : 'muhurtham';
      if (t.includes('special')) return 'special';
      if (t.includes('valarpirai')) return 'valarpirai';
      return wk ? 'weekend' : 'weekday';
    };

    return {
      hall: {
        name: 'Main Marriage Hall',
        org: 'Demo Functions',
        role: 'Admin',
        address: '12, Temple Street, Chennai',
        phone: '9000000000',
        capacity: '800 guests',
      },
      customers,
      bookings,
      importantDates,
      blockedDays,
      segments,
      rates,
      eventTypes,
      signedIn,
      typesFor,
      categoryFor,
      priceFor: (iso, slot) => rateTotal(rates[slot][categoryFor(iso)]),
      rateFor: (iso, slot) => rates[slot][categoryFor(iso)],
      segmentState: (iso, excludeId) => {
        const blocked = blockedDays.includes(iso);
        const st: Record<SegmentKey, SegState> = {
          early: blocked ? 'blocked' : 'free',
          late: blocked ? 'blocked' : 'free',
          evening: blocked ? 'blocked' : 'free',
        };
        if (blocked) return st;
        for (const b of bookings) {
          if (b.date !== iso || b.status === 'cancelled' || b.id === excludeId) continue;
          for (const s of SLOT_SEGMENTS[b.slot]) {
            st[s] = b.status === 'confirmed' ? 'booked' : st[s] === 'booked' ? 'booked' : 'tentative';
          }
        }
        return st;
      },
      customerById: (id) => customers.find((c) => c.id === id),
      bookingsOn: (iso) => bookings.filter((b) => b.date === iso && b.status !== 'cancelled'),
      monthSummary: (y, m) => {
        const list = bookings.filter((b) => {
          const d = parseISO(b.date);
          return b.status !== 'cancelled' && d.getFullYear() === y && d.getMonth() === m;
        });
        const revenue = list.reduce((a, b) => a + b.total, 0);
        const received = list.reduce((a, b) => a + paidOf(b), 0);
        return { count: list.length, revenue, received, due: revenue - received };
      },

      addCustomer: (c) => {
        const nc = { ...c, id: uid('c') };
        setCustomers((xs) => [...xs, nc]);
        return nc;
      },
      addBooking: ({ advance, ...b }) => {
        const year = parseISO(b.date).getFullYear();
        const nb: Booking = {
          ...b,
          id: uid('b'),
          number: `HB-${year}-${String(bookings.length + 1).padStart(4, '0')}`,
          bookedOn: todayISO(),
          payments: advance ? [{ id: uid('p'), amount: advance, date: todayISO(), mode: 'Advance' }] : [],
        };
        setBookings((xs) => [...xs, nb]);
        return nb;
      },
      addPayment: (bookingId, p) =>
        setBookings((xs) =>
          xs.map((b) => {
            if (b.id !== bookingId) return b;
            // Never record more than what is still due.
            const amount = Math.min(p.amount, balanceOf(b));
            if (amount <= 0) return b;
            return { ...b, payments: [...b.payments, { ...p, amount, id: uid('p') }] };
          }),
        ),
      updateBooking: (id, patch) =>
        setBookings((xs) => xs.map((b) => (b.id === id ? { ...b, ...patch } : b))),
      cancelBooking: (bookingId) =>
        setBookings((xs) => xs.map((b) => (b.id === bookingId ? { ...b, status: 'cancelled' } : b))),
      toggleBlock: (iso) =>
        setBlockedDays((xs) => (xs.includes(iso) ? xs.filter((x) => x !== iso) : [...xs, iso])),
      addImportantDate: (date, type, title) =>
        setImportantDates((xs) =>
          xs.some((x) => x.date === date && x.type === type)
            ? xs
            : [...xs, { id: uid('d'), date, type, ...(title ? { title } : {}) }],
        ),
      removeImportantDate: (id) => setImportantDates((xs) => xs.filter((x) => x.id !== id)),
      updateSegment: (key, start, end) =>
        setSegments((xs) => xs.map((s) => (s.key === key ? { ...s, start, end } : s))),
      updateRate: (slot, cat, v) =>
        setRates((r) => ({ ...r, [slot]: { ...r[slot], [cat]: v } })),
      addEventType: (t) => setEventTypes((xs) => (xs.includes(t) ? xs : [...xs, t])),
      setSignedIn,
    };
  }, [customers, bookings, importantDates, blockedDays, segments, rates, eventTypes, signedIn]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore must be used inside StoreProvider');
  return s;
}
