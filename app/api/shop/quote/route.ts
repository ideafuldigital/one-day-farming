import { z } from 'zod';
import { publicCatalog } from '@/lib/admin/catalog';
import { assertSameOrigin, AccessError } from '@/lib/admin/policy';
import { json, failure, readBody } from '@/lib/admin/server';
export const dynamic = 'force-dynamic';
export async function POST(req: Request) { try {
    assertSameOrigin(req);
    const b = z.object({ lines: z.array(z.object({ id: z.string().max(100), variantId: z.string().max(50).optional(), quantity: z.number().int().min(1).max(10) })).min(1).max(50), fulfillment: z.enum(['pickup', 'courier']) }).parse(await readBody(req)), catalog = await publicCatalog();
    if (new Set(b.lines.map(l => l.id + ':' + (l.variantId ?? ''))).size !== b.lines.length)
        throw new AccessError(400, 'Duplicate basket lines.');
    const lines = b.lines.map(l => { const p = catalog.products.find(p => p.id === l.id && p.inStock); if (!p)
        throw new AccessError(409, 'A product is no longer available.'); const variant = p.variants?.find(v => v.id === l.variantId); if (l.variantId && !variant)
        throw new AccessError(409, 'A product option is no longer available.'); const price = variant?.price ?? p.price; return { ...l, title: p.name, option: variant?.label ?? p.unit, price, total: price * l.quantity }; });
    const subtotal = lines.reduce((s, l) => s + l.total, 0), shipping = b.fulfillment === 'courier' && subtotal ? 120 : 0;
    return json({ lines, subtotal, shipping, total: subtotal + shipping, demo: true });
}
catch (e) {
    return failure(e);
} }
