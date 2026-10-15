import { z } from 'zod';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { database, json, failure, readBody } from '@/lib/admin/server';
import { assertSameOrigin, AccessError } from '@/lib/admin/policy';
import { publicCatalog } from '@/lib/admin/catalog';
export const dynamic = 'force-dynamic';
async function check(cluster: string, stay: string) { if (!(await publicCatalog()).stays.some(s => s.clusterId === cluster && s.id === stay))
    throw new AccessError(404, 'Stay unavailable.'); }
export async function GET(req: Request) { try {
    const p = new URL(req.url).searchParams, cluster = p.get('cluster') ?? '', stay = p.get('stay') ?? '';
    await check(cluster, stay);
    const reviews = await database().prepare("SELECT id,name,rating,comment,created_at FROM stay_reviews WHERE cluster = ? AND stay_id = ? AND status = 'approved' ORDER BY created_at DESC LIMIT 100").bind(cluster, stay).all();
    const summary = await database().prepare("SELECT COUNT(*) AS count,AVG(rating) AS average FROM stay_reviews WHERE cluster = ? AND stay_id = ? AND status = 'approved'").bind(cluster, stay).first();
    return json({ reviews: reviews.results, summary });
}
catch (e) {
    return failure(e);
} }
export async function POST(req: Request) { try {
    assertSameOrigin(req);
    const user = await getChatGPTUser();
    if (!user)
        throw new AccessError(401, 'Sign in to submit a review.');
    const b = z.object({ cluster: z.string(), stay: z.string(), name: z.string().trim().min(2).max(80), rating: z.number().int().min(1).max(5), comment: z.string().trim().min(10).max(2000) }).parse(await readBody(req));
    await check(b.cluster, b.stay);
    const result = await database().prepare("INSERT OR IGNORE INTO stay_reviews (id,cluster,stay_id,user_id,name,rating,comment,status,version,created_at) VALUES (?,?,?,?,?,?,?,'pending',1,?)").bind(crypto.randomUUID(), b.cluster, b.stay, user.userId, b.name, b.rating, b.comment, new Date().toISOString()).run();
    if (!result.meta.changes)
        throw new AccessError(409, 'You already submitted a review for this stay.');
    return json({ message: 'Thank you. Your review is awaiting moderation.' }, 201);
}
catch (e) {
    return failure(e);
} }
