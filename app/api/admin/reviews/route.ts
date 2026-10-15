import { z } from 'zod';
import { principal, database, json, failure, readBody } from '@/lib/admin/server';
import { assertPermission, assertSameOrigin, AccessError } from '@/lib/admin/policy';
import { audit } from '@/lib/features/server';
export const dynamic = 'force-dynamic';
export async function GET(req: Request) { try {
    const p = await principal(), cluster = new URL(req.url).searchParams.get('cluster') ?? '';
    assertPermission(p, cluster, 'stays');
    const r = await database().prepare('SELECT id,cluster,stay_id,name,rating,comment,status,version,created_at FROM stay_reviews WHERE cluster = ? ORDER BY created_at DESC LIMIT 200').bind(cluster).all();
    return json({ reviews: r.results });
}
catch (e) {
    return failure(e);
} }
export async function POST(req: Request) { try {
    assertSameOrigin(req);
    const p = await principal(), b = z.object({ cluster: z.string(), id: z.string().uuid(), version: z.number().int().min(1), status: z.enum(['approved', 'rejected']) }).parse(await readBody(req));
    assertPermission(p, b.cluster, 'stays');
    const r = await database().batch([database().prepare('UPDATE stay_reviews SET status = ?,version = version + 1 WHERE id = ? AND cluster = ? AND version = ?').bind(b.status, b.id, b.cluster, b.version), audit(p, b.cluster, 'review_' + b.status, 'reviews', b.id)]);
    if (!r[0].meta.changes)
        throw new AccessError(409, 'Review changed. Reload.');
    return json({ success: true });
}
catch (e) {
    return failure(e);
} }
