import { z } from 'zod';
import { principal, database, json, failure, readBody } from '@/lib/admin/server';
import { assertSameOrigin, AccessError } from '@/lib/admin/policy';
import { scopeAccess, customization, audit } from '@/lib/features/server';
import { scopeSchema, customizationSchema } from '@/lib/features/schema';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) { try {
    const p = await principal(), scope = new URL(request.url).searchParams.get('scope') ?? '';
    scopeAccess(p, scope, true);
    return json(await customization(scope));
}
catch (e) {
    return failure(e);
} }
export async function POST(request: Request) { try {
    assertSameOrigin(request);
    const p = await principal();
    const b = z.object({ scope: scopeSchema, version: z.number().int().min(0), value: customizationSchema }).parse(await readBody(request));
    scopeAccess(p, b.scope, true);
    const d = database(), now = new Date().toISOString();
    const q = b.version ? d.prepare('UPDATE site_customizations SET payload = ?, version = version + 1, updated_at = ? WHERE scope = ? AND version = ?').bind(JSON.stringify(b.value), now, b.scope, b.version) : d.prepare('INSERT INTO site_customizations (scope,payload,version,updated_at) SELECT ?,?,1,? WHERE NOT EXISTS (SELECT 1 FROM site_customizations WHERE scope = ?)').bind(b.scope, JSON.stringify(b.value), now, b.scope);
    const r = await d.batch([q, audit(p, b.scope, 'customize', 'customization', b.scope)]);
    if (!r[0].meta.changes)
        throw new AccessError(409, 'Content changed. Reload before saving.');
    return json({ success: true });
}
catch (e) {
    return failure(e);
} }
