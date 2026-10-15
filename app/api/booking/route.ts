import { z } from 'zod';
import { json, failure, readBody } from '@/lib/admin/server';
import { AccessError, assertSameOrigin } from '@/lib/admin/policy';
import { services, readState, mutate, publicBooking } from '@/lib/booking/server';
import { day, defaults, availability, addDays, today, type Reservation } from '@/lib/booking/engine';
export const dynamic = 'force-dynamic';
function parseExtras(value: string) { try {
    return JSON.parse(value) as unknown;
}
catch {
    throw new AccessError(400, 'Invalid add-on selection.');
} }
const selection = z.object({ start: day, end: day, slot: z.string(), guests: z.number().int().min(1).max(50), meal: z.boolean(), units: z.number().int().min(1).max(20).optional(), optionId: z.string().max(50).optional(), addons: z.array(z.object({ id: z.string().uuid(), quantity: z.number().int().min(1).max(20) })).max(30).optional() });
export async function GET(request: Request) { try {
    const p = new URL(request.url).searchParams, cluster = p.get('cluster') ?? '', list = await services(cluster), service = list.find(x => x.id === p.get('service'));
    if (!service)
        throw new AccessError(404, 'Service unavailable.');
    const { state } = await readState(cluster, list), settings = state.settings[service.id] ?? defaults(service);
    const guests = z.coerce.number().int().min(1).max(50).parse(p.get('guests') ?? 2), nights = z.coerce.number().int().min(1).max(30).parse(p.get('nights') ?? 1);
    const start = day.parse(p.get('from') ?? today());
    const dates = Array.from({ length: 30 }, (_, i) => { const date = addDays(start, i); return { date, slots: settings.slots.map(slot => ({ slot, ...availability(state, service, settings, { start: date, end: service.stay ? addDays(date, nights) : date, slot, guests, meal: p.get('meal') === 'true', units: z.coerce.number().int().min(1).max(20).parse(p.get('units') ?? 1), optionId: p.get('optionId') ?? undefined, addons: selection.shape.addons.parse(parseExtras(p.get('addons') ?? '[]')) }) })) }; });
    return json({ service, settings, dates });
}
catch (e) {
    return failure(e);
} }
export async function POST(request: Request) {
    try {
        assertSameOrigin(request);
        const b = z.object({ cluster: z.string(), service: z.string(), action: z.enum(['hold', 'confirm', 'cancel']), key: z.string().uuid().optional(), id: z.string().uuid().optional(), token: z.string().uuid().optional(), selection: selection.optional(), policyVersion: z.number().int().optional(), expectedTotal: z.number().optional() }).parse(await readBody(request));
        const list = await services(b.cluster);
        const service = list.find(x => x.id === b.service);
        if (!service)
            throw new AccessError(404, 'Service unavailable.');
        const result = await mutate(b.cluster, list, state => {
            const s = state.settings[service.id] ?? defaults(service);
            if (b.action === 'hold') {
                if (!b.selection || !b.key)
                    throw new AccessError(400, 'Choose dates, guests and a slot.');
                const old = state.bookings.find(x => x.key === b.key);
                if (old) {
                    if (old.service !== b.service)
                        throw new AccessError(409, 'Request key already used.');
                    return { booking: publicBooking(old), token: old.token };
                }
                if (b.policyVersion !== s.policyVersion)
                    throw new AccessError(409, 'Conditions changed. Refresh and accept the current conditions.');
                const a = availability(state, service, s, b.selection);
                if (!a.available)
                    throw new AccessError(409, a.reason);
                if (a.total !== b.expectedTotal)
                    throw new AccessError(409, 'Price changed. Refresh to review the current total.');
                const booking: Reservation = { ...b.selection, id: crypto.randomUUID(), key: b.key, token: crypto.randomUUID(), service: service.id, status: 'held', expires: Date.now() + 300000, total: a.total, lines: a.lines, policy: s.terms, policyVersion: s.policyVersion, createdAt: new Date().toISOString(), demo: true, resource: s.resource };
                state.bookings.push(booking);
                return { booking: publicBooking(booking), token: booking.token };
            }
            const booking = state.bookings.find(x => x.id === b.id && x.token === b.token && x.service === b.service);
            if (!booking)
                throw new AccessError(404, 'Reservation not found.');
            if (b.action === 'cancel')
                booking.status = 'cancelled';
            else {
                if (booking.status === 'cancelled' || booking.status === 'held' && booking.expires <= Date.now())
                    throw new AccessError(409, 'Checkout hold expired or cancelled. Choose availability again.');
                booking.status = 'confirmed';
            }
            return { booking: publicBooking(booking), token: booking.token };
        });
        return json(result);
    }
    catch (e) {
        return failure(e);
    }
}
