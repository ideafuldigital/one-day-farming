import { z } from 'zod';
import { principal, json, failure, readBody } from '@/lib/admin/server';
import { assertPermission, assertSameOrigin, AccessError } from '@/lib/admin/policy';
import { services, readState, mutate, publicBooking } from '@/lib/booking/server';
import { defaults, settingsSchema, validateExisting, availability, day, type Reservation } from '@/lib/booking/engine';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) { try {
    const p = await principal(), cluster = new URL(request.url).searchParams.get('cluster') ?? '';
    assertPermission(p, cluster, 'bookings');
    const list = await services(cluster), { state, version } = await readState(cluster, list);
    return json({ services: list, settings: Object.fromEntries(list.map(s => [s.id, state.settings[s.id] ?? defaults(s)])), bookings: state.bookings.map(publicBooking), version });
}
catch (e) {
    return failure(e);
} }
export async function POST(request: Request) {
    try {
        assertSameOrigin(request);
        const p = await principal();
        const b = z.object({ cluster: z.string(), action: z.enum(['settings', 'cancel', 'reset', 'manual']), service: z.string().optional(), settings: z.unknown().optional(), id: z.string().optional(), version: z.number().int().optional(), selection: z.object({ start: day, end: day, slot: z.string(), guests: z.number().int().min(1).max(50), meal: z.boolean(), units: z.number().int().min(1).max(20).optional(), optionId: z.string().max(50).optional(), addons: z.array(z.object({ id: z.string().uuid(), quantity: z.number().int().min(1).max(20) })).max(30).optional() }).optional() }).parse(await readBody(request));
        assertPermission(p, b.cluster, 'bookings');
        const list = await services(b.cluster);
        await mutate(b.cluster, list, (state, version) => {
            if (b.action === 'cancel') {
                const record = state.bookings.find(x => x.id === b.id);
                if (!record)
                    throw new AccessError(404, 'Booking not found.');
                record.status = 'cancelled';
                return;
            }
            if (b.action === 'reset') {
                state.bookings = [];
                return;
            }
            const service = list.find(x => x.id === b.service);
            if (!service)
                throw new AccessError(404, 'Service not found.');
            if (b.action === 'settings') {
                if (b.version !== version)
                    throw new AccessError(409, 'Inventory changed. Reload before saving settings.');
                const next = settingsSchema.parse(b.settings);
                try {
                    validateExisting(state, service, next);
                }
                catch (e) {
                    throw new AccessError(409, (e as Error).message);
                }
                if (next.resource && Object.entries(state.settings).some(([id, s]) => id !== service.id && s.resource === next.resource && s.resourceCapacity !== next.resourceCapacity))
                    throw new AccessError(400, 'Services sharing a resource must use the same resource capacity.');
                next.policyVersion = (state.settings[service.id]?.policyVersion ?? 0) + 1;
                state.settings[service.id] = next;
                return;
            }
            if (!b.selection)
                throw new AccessError(400, 'Selection required.');
            const s = state.settings[service.id] ?? defaults(service), a = availability(state, service, s, b.selection);
            if (!a.available)
                throw new AccessError(409, a.reason);
            const booking: Reservation = { ...b.selection, id: crypto.randomUUID(), key: crypto.randomUUID(), token: crypto.randomUUID(), service: service.id, status: 'confirmed', expires: 0, total: a.total, lines: a.lines, policy: s.terms, policyVersion: s.policyVersion, createdAt: new Date().toISOString(), demo: true, resource: s.resource };
            state.bookings.push(booking);
        }, p, 'booking_' + b.action);
        return json({ success: true });
    }
    catch (e) {
        return failure(e);
    }
}
