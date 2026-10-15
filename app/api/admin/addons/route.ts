import { publicCatalog } from '@/lib/admin/catalog';
import { z } from 'zod';
import { principal, database, json, failure, readBody } from '@/lib/admin/server';
import { assertSameOrigin, assertPermission, AccessError } from '@/lib/admin/policy';
import { addons, audit } from '@/lib/features/server';
import { addonSchema } from '@/lib/features/schema';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) { try {
    const p = await principal(), cluster = new URL(request.url).searchParams.get('cluster') ?? '';
    assertPermission(p, cluster);
    return json({ addons: await addons(cluster) });
}
catch (e) {
    return failure(e);
} }
export async function POST(request: Request) { try {
    assertSameOrigin(request);
    const p = await principal(), b = z.object({ cluster: z.string(), id: z.string().uuid(), version: z.number().int().min(0), deleted: z.boolean().default(false), value: addonSchema }).parse(await readBody(request));
    assertPermission(p, b.cluster);
    if (!b.deleted && b.value.services.length) {
        const catalog = await publicCatalog();
        const valid = [...catalog.stays, ...catalog.packages].filter(x => x.clusterId === b.cluster).map(x => x.id);
        if (b.value.services.some(id => !valid.includes(id)))
            throw new AccessError(400, 'Choose service IDs from this cluster only.');
    }
    const d = database(), now = new Date().toISOString();
    const q = b.version ? d.prepare('UPDATE booking_addons SET payload = ?, deleted = ?, version = version + 1, updated_at = ? WHERE id = ? AND cluster = ? AND version = ?').bind(JSON.stringify(b.value), +b.deleted, now, b.id, b.cluster, b.version) : d.prepare('INSERT INTO booking_addons (id,cluster,payload,deleted,version,updated_at) SELECT ?,?,?,?,1,? WHERE NOT EXISTS (SELECT 1 FROM booking_addons WHERE id = ?)').bind(b.id, b.cluster, JSON.stringify(b.value), +b.deleted, now, b.id);
    const r = await d.batch([q, audit(p, b.cluster, b.deleted ? 'delete_addon' : 'save_addon', 'addons', b.id)]);
    if (!r[0].meta.changes)
        throw new AccessError(409, 'Add-on changed. Reload before saving.');
    return json({ success: true });
}
catch (e) {
    return failure(e);
} }
