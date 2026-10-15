import type { Addon } from '@/lib/features/schema';
import { z } from 'zod';
export const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => !isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v);
const count = z.number().int().min(1).max(1000), rate = z.number().int().min(0).max(1000000);
export const settingsSchema = z.object({ enabled: z.boolean(), first: day, last: day, advance: count, notice: z.number().min(0).max(720), minGuests: count, maxGuests: count, minNights: count, maxNights: count, slotCapacity: count, dailyBookings: count, dailyGuests: count, base: rate, weekend: rate, slots: z.array(z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)).min(1).max(12), closedDates: z.array(day).max(366), closedSlots: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}@\d{2}:\d{2}$/)).max(500), seasons: z.array(z.object({ name: z.string().min(1).max(80), from: day, to: day, weekday: rate, weekend: rate })).max(20), holidays: z.array(z.object({ date: day, rate })).max(100), overrides: z.array(z.object({ date: day, rate })).max(100), resource: z.string().max(80), resourceCapacity: count, terms: z.string().min(10).max(4000), policyVersion: z.number().int().min(1) }).superRefine((s, c) => { if (s.first > s.last || s.minGuests > s.maxGuests || s.minNights > s.maxNights)
    c.addIssue({ code: 'custom', message: 'Invalid date, guest or night range.' }); for (let i = 0; i < s.seasons.length; i++) {
    const a = s.seasons[i];
    if (a.from > a.to || s.seasons.some((b, j) => j < i && a.from <= b.to && b.from <= a.to))
        c.addIssue({ code: 'custom', message: 'Seasons cannot overlap.' });
} if (new Set(s.slots).size !== s.slots.length || new Set(s.holidays.map(x => x.date)).size !== s.holidays.length || new Set(s.overrides.map(x => x.date)).size !== s.overrides.length)
    c.addIssue({ code: 'custom', message: 'Duplicate slots or price dates.' }); });
export type Settings = z.infer<typeof settingsSchema>;
export interface Service {
    id: string;
    title: string;
    stay: boolean;
    vehicle: boolean;
    capacity: number;
    price: number;
    pricingOptions?: {
        id: string;
        label: string;
        priceAdjustment: number;
    }[];
    addons?: Addon[];
}
export interface Reservation {
    id: string;
    key: string;
    token: string;
    service: string;
    start: string;
    end: string;
    slot: string;
    guests: number;
    meal: boolean;
    units?: number;
    optionId?: string;
    addons?: {
        id: string;
        quantity: number;
    }[];
    status: 'held' | 'confirmed' | 'cancelled';
    expires: number;
    total: number;
    lines: {
        date: string;
        label: string;
        rate: number;
        quantity: number;
        total: number;
    }[];
    policy: string;
    policyVersion: number;
    createdAt: string;
    demo: true;
    resource: string;
}
export interface State {
    settings: Record<string, Settings>;
    bookings: Reservation[];
}
export const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
export const addDays = (d: string, n: number) => new Date(Date.parse(d) + n * 86400000).toISOString().slice(0, 10);
export function defaults(s: Service): Settings { return { enabled: true, first: today(), last: addDays(today(), 90), advance: 90, notice: 2, minGuests: 1, maxGuests: s.capacity, minNights: 1, maxNights: 14, slotCapacity: s.stay || s.vehicle ? 1 : 12, dailyBookings: 5, dailyGuests: 30, base: s.price, weekend: Math.round(s.price * 1.2), slots: s.stay ? ['14:00'] : ['09:00', '14:00'], closedDates: [], closedSlots: [], seasons: [], holidays: [], overrides: [], resource: '', resourceCapacity: 1, terms: 'Demo only. No payment or real reservation. Cancel this demo at any time to release capacity. Arrive 15 minutes early. Weather may require rescheduling. Children must be accompanied by an adult.', policyVersion: 1 }; }
export function occupied(b: Pick<Reservation, 'start' | 'end'>, stay: boolean) { const out = [b.start]; if (stay) {
    for (let d = addDays(b.start, 1); d < b.end; d = addDays(d, 1)) {
        out.push(d);
        if (out.length > 60)
            throw Error('Stay too long.');
    }
} return out; }
export function active(b: Reservation, now = Date.now()) { return b.status === 'confirmed' || b.status === 'held' && b.expires > now; }
export function price(s: Settings, d: string) { const weekend = [0, 6].includes(new Date(d + 'T12:00:00Z').getUTCDay()); const override = s.overrides.find(x => x.date === d), holiday = s.holidays.find(x => x.date === d), season = s.seasons.find(x => x.from <= d && x.to >= d); return override ? { rate: override.rate, label: 'Specific date' } : holiday ? { rate: holiday.rate, label: 'Holiday' } : season ? { rate: weekend ? season.weekend : season.weekday, label: season.name + (weekend ? ' weekend' : ' weekday') } : { rate: weekend ? s.weekend : s.base, label: weekend ? 'Weekend' : 'Base weekday' }; }
export interface Selection {
    start: string;
    end: string;
    slot: string;
    guests: number;
    meal: boolean;
    units?: number;
    optionId?: string;
    addons?: {
        id: string;
        quantity: number;
    }[];
}
export function availability(state: State, service: Service, s: Settings, q: Selection, now = Date.now()) {
    const fail = (reason: string) => ({ available: false, reason, remaining: 0, total: 0, lines: [] as Reservation['lines'] });
    const units = q.units ?? 1;
    if (!Number.isInteger(units) || units < 1 || units > 20 || (!service.stay && !service.vehicle && units !== 1))
        return fail('Invalid unit quantity');
    const option = service.pricingOptions?.find(o => o.id === q.optionId);
    if (q.optionId && !option)
        return fail('Selected option unavailable');
    const extras = q.addons ?? [];
    if (new Set(extras.map(a => a.id)).size !== extras.length)
        return fail('Duplicate add-ons');
    for (const a of extras) {
        const item = service.addons?.find(x => x.id === a.id && x.enabled && !x.deleted);
        if (!item || !Number.isInteger(a.quantity) || a.quantity < 1 || a.quantity > item.maxQuantity)
            return fail('Selected add-on unavailable');
    }
    if (!s.enabled)
        return fail('Service disabled');
    if (q.guests < s.minGuests || q.guests > s.maxGuests || q.guests > service.capacity * units)
        return fail('Group size outside service limits');
    const nights = (Date.parse(q.end) - Date.parse(q.start)) / 86400000;
    if (service.stay && (nights < s.minNights || nights > s.maxNights))
        return fail('Stay duration outside limits');
    if (!s.slots.includes(q.slot))
        return fail('Slot unavailable');
    const dates = occupied(q, service.stay);
    let remaining = 10000;
    const lines: Reservation['lines'] = [];
    for (const d of dates) {
        if (d < s.first || d > s.last || d < today() || d > addDays(today(), s.advance))
            return fail('Not open for booking');
        if (Date.parse(d + 'T' + q.slot + ':00+05:30') < now + s.notice * 3600000)
            return fail('Minimum booking notice');
        if (s.closedDates.includes(d) || s.closedSlots.includes(d + '@' + q.slot))
            return fail('Closed by administrator');
        const same = state.bookings.filter(b => active(b, now) && b.service === service.id && b.start <= d && (service.stay ? d < b.end : d === b.start));
        const slot = same.filter(b => service.stay || b.slot === q.slot);
        const used = slot.reduce((n, b) => n + (service.stay || service.vehicle ? (b.units ?? 1) : b.guests), 0);
        const dailyGuests = same.reduce((n, b) => n + b.guests, 0);
        if (same.length >= s.dailyBookings)
            return fail('Daily booking limit reached');
        if (dailyGuests + q.guests > s.dailyGuests)
            return fail('Daily guest limit reached');
        const places = s.slotCapacity - used;
        if (places < (service.stay || service.vehicle ? units : q.guests))
            return fail('Full for this group');
        if (s.resource) {
            const shared = state.bookings.filter(b => active(b, now) && b.resource === s.resource && b.start <= d && (b.end > b.start ? d < b.end : d === b.start) && (b.end > b.start || service.stay || b.slot === q.slot));
            if (shared.reduce((n, b) => n + (b.units ?? 1), 0) + units > s.resourceCapacity)
                return fail('Shared room, guide or vehicle unavailable');
        }
        remaining = Math.min(remaining, service.stay || service.vehicle ? places : Math.min(places, s.dailyGuests - dailyGuests));
        const base = price(s, d), p = { rate: base.rate + (option?.priceAdjustment ?? 0), label: base.label + (option ? ' · ' + option.label : '') }, quantity = service.stay || service.vehicle ? units : q.guests;
        lines.push({ date: d, ...p, quantity, total: p.rate * quantity });
        if (service.stay && q.meal)
            lines.push({ date: d, label: 'Breakfast', rate: 300, quantity: q.guests, total: 300 * q.guests });
    }
    for (const a of extras) {
        const item = service.addons!.find(x => x.id === a.id)!;
        const quantity = a.quantity * (item.basis.includes('person') ? q.guests : 1) * (item.basis.includes('night') ? dates.length : 1);
        lines.push({ date: q.start, label: item.title + ' · ' + item.basis.replaceAll('_', ' '), rate: item.price, quantity, total: item.price * quantity });
    }
    return { available: true, reason: remaining <= 2 ? 'Limited availability' : 'Available', remaining, total: lines.reduce((n, l) => n + l.total, 0), lines };
}
export function validateExisting(state: State, service: Service, next: Settings) { const current = state.settings[service.id]; if (current && current.resource !== next.resource && state.bookings.some(b => b.service === service.id && active(b) && b.end >= today()))
    throw Error('Cancel existing reservations before changing the shared resource.'); state.settings[service.id] = next; try {
    for (const b of state.bookings.filter(b => b.service === service.id && active(b))) {
        const others = { ...state, bookings: state.bookings.filter(x => x.id !== b.id) };
        const relaxed = { ...next, enabled: true, first: '2000-01-01', last: '2099-12-31', advance: 1000, notice: 0, closedDates: [], closedSlots: [], slots: [...new Set([...next.slots, b.slot])] };
        if (b.start >= today() && !availability(others, service, relaxed, { ...b, optionId: undefined, addons: [] }, 0).available)
            throw Error('Capacity or group limits conflict with existing reservations. Cancel or reschedule explicitly first.');
    }
}
finally {
    if (current)
        state.settings[service.id] = current;
    else
        delete state.settings[service.id];
} }
