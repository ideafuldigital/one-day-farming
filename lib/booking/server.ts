import { addons } from '@/lib/features/server';
import { database } from '@/lib/admin/server';
import { publicCatalog } from '@/lib/admin/catalog';
import { AccessError, clusterIds, type Principal } from '@/lib/admin/policy';
import { active, addDays, availability, defaults, today, type State, type Service, type Reservation } from './engine';
export async function services(cluster: string) { if (!clusterIds.includes(cluster as typeof clusterIds[number]))
    throw new AccessError(400, 'Unknown cluster.'); const c = await publicCatalog(), extra = await addons(cluster); const options = (x: {
    id: string;
    pricingOptions?: Service['pricingOptions'];
}) => ({ pricingOptions: x.pricingOptions ?? [], addons: extra.filter(a => a.enabled && (!a.services.length || a.services.includes(x.id))) }); return [...c.stays.filter(x => x.clusterId === cluster).map(x => ({ ...options(x), id: x.id, title: x.title, stay: true, vehicle: false, capacity: x.capacity, price: x.pricePerNight })), ...c.packages.filter(x => x.clusterId === cluster).map(x => ({ ...options(x), id: x.id, title: x.title, stay: false, vehicle: x.type === 'jeep_safari', capacity: x.type === 'jeep_safari' ? 6 : 20, price: x.pricePerVehicleOrPerson }))]; }
export function seed(list: Service[]): State {
    const state: State = { settings: {}, bookings: [] };
    for (const service of list) {
        const s = defaults(service);
        if (!service.stay && !service.vehicle)
            s.slots = ['09:00', '14:00', '16:00'];
        if (service.id.endsWith('-cottage'))
            s.enabled = false;
        s.closedDates = [addDays(today(), 3)];
        s.closedSlots = [addDays(today(), 5) + '@' + s.slots[0]];
        s.holidays = [{ date: addDays(today(), 6), rate: Math.round(s.base * 1.5) }];
        s.seasons = [{ name: 'Demo peak season', from: addDays(today(), 10), to: addDays(today(), 20), weekday: Math.round(s.base * 1.4), weekend: Math.round(s.base * 1.6) }];
        state.settings[service.id] = s;
        for (let i = 1; i < 30; i++) {
            if (i % 7 === 0)
                continue;
            const start = addDays(today(), i);
            const guests = service.stay || service.vehicle ? 2 : i === 2 ? 12 : i === 4 ? 10 : 4;
            const q = { start, end: service.stay ? addDays(start, 1) : start, slot: s.slots[0], guests, meal: false };
            const a = availability(state, service, s, q);
            if (!a.available)
                continue;
            state.bookings.push({ id: crypto.randomUUID(), key: crypto.randomUUID(), token: crypto.randomUUID(), service: service.id, ...q, status: i === 8 ? 'cancelled' : i === 9 ? 'held' : 'confirmed', expires: Date.now() - 1000, total: a.total, lines: a.lines, policy: s.terms, policyVersion: s.policyVersion, createdAt: new Date().toISOString(), demo: true, resource: s.resource });
        }
        if (!service.stay && !service.vehicle) {
            for (const [offset, groups, guests] of [[7, 5, 2], [14, 3, 10]]) {
                for (let j = 0; j < groups; j++) {
                    const start = addDays(today(), offset), slot = s.slots[j % s.slots.length], q = { start, end: start, slot, guests, meal: false };
                    const a = availability(state, service, s, q);
                    if (a.available)
                        state.bookings.push({ id: crypto.randomUUID(), key: crypto.randomUUID(), token: crypto.randomUUID(), service: service.id, ...q, status: 'confirmed', expires: 0, total: a.total, lines: a.lines, policy: s.terms, policyVersion: s.policyVersion, createdAt: new Date().toISOString(), demo: true, resource: s.resource });
                }
            }
        }
    }
    return state;
}
export async function readState(cluster: string, list: Service[]) { const db = database(); let row = await db.prepare('SELECT payload,version FROM booking_state WHERE cluster = ?').bind(cluster).first<{
    payload: string;
    version: number;
}>(); if (!row) {
    await db.prepare('INSERT OR IGNORE INTO booking_state (cluster,payload,version) VALUES (?,?,0)').bind(cluster, JSON.stringify(seed(list))).run();
    row = await db.prepare('SELECT payload,version FROM booking_state WHERE cluster = ?').bind(cluster).first<{
        payload: string;
        version: number;
    }>();
} if (!row)
    throw new AccessError(503, 'Booking database unavailable.'); return { state: JSON.parse(row.payload) as State, version: row.version }; }
export async function mutate<T>(cluster: string, list: Service[], fn: (s: State, v: number) => T, actor?: Principal, action = 'booking_update') {
    for (let attempt = 0; attempt < 8; attempt++) {
        const { state, version } = await readState(cluster, list);
        const result = fn(state, version);
        if (state.bookings.length > 5000)
            throw new AccessError(409, 'Demo inventory is full. Ask the administrator to reset demo data.');
        const update = database().prepare('UPDATE booking_state SET payload = ?, version = version + 1 WHERE cluster = ? AND version = ?').bind(JSON.stringify(state), cluster, version);
        let changes: number;
        if (actor) {
            const audit = database().prepare('INSERT INTO admin_audit (id,cluster_id,actor_id,actor_email,action,kind,record_id,created_at) SELECT ?,?,?,?,?,?,?,? WHERE changes() > 0').bind(crypto.randomUUID(), cluster, actor.userId, actor.email, action, 'bookings', 'inventory', new Date().toISOString());
            changes = (await database().batch([update, audit]))[0].meta.changes;
        }
        else
            changes = (await update.run()).meta.changes;
        if (changes)
            return result;
    }
    throw new AccessError(409, 'Availability changed. Refresh and try again.');
}
export function publicBooking(b: Reservation) { const { token: _, key: __, ...safe } = b; return safe; }
export { active };
