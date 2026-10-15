import { env } from '@/local/runtime';
import { z } from 'zod';
import { principal, database, json, failure, readBody } from '@/lib/admin/server';
import { AccessError, assertSameOrigin } from '@/lib/admin/policy';
import { scopeAccess, media, audit } from '@/lib/features/server';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) { try {
    const p = await principal(), scope = new URL(request.url).searchParams.get('scope') ?? '';
    scopeAccess(p, scope);
    return json({ images: await media(scope) });
}
catch (e) {
    return failure(e);
} }
export async function POST(request: Request) { try {
    const p = await principal();
    if (request.headers.get('origin') !== (new URL(request.url).protocol + '//' + (request.headers.get('host') || new URL(request.url).host)))
        throw new AccessError(403, 'Same-origin upload required.');
    const scope = new URL(request.url).searchParams.get('scope') ?? '';
    scopeAccess(p, scope);
    if (!env.BUCKET)
        throw new AccessError(503, 'Media storage unavailable.');
    if (Number(request.headers.get('content-length') ?? 0) > 6 * 1024 * 1024)
        throw new AccessError(413, 'Maximum image size is 5 MB.');
    if (!request.body)
        throw new AccessError(400, 'Image required.');
    const reader = request.body.getReader(), chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
        const part = await reader.read();
        if (part.done)
            break;
        size += part.value.byteLength;
        if (size > 6 * 1024 * 1024) {
            await reader.cancel();
            throw new AccessError(413, 'Maximum image size is 5 MB.');
        }
        chunks.push(part.value);
    }
    const multipart = new Blob(chunks as BlobPart[]);
    const form = await new Response(multipart, { headers: { 'Content-Type': request.headers.get('content-type') ?? '' } }).formData(), file = form.get('file');
    if (!(file instanceof File) || file.size < 12 || file.size > 5 * 1024 * 1024)
        throw new AccessError(400, 'Upload a JPEG, PNG or WebP image up to 5 MB.');
    const bytes = new Uint8Array(await file.arrayBuffer());
    const mime = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 ? 'image/jpeg' : bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71 ? 'image/png' : String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP' ? 'image/webp' : null;
    if (!mime)
        throw new AccessError(400, 'Unsupported image content. SVG and non-image files are not accepted.');
    const id = crypto.randomUUID(), key = scope + '/' + id, alt = z.string().trim().min(1).max(250).parse(form.get('alt')), name = file.name.slice(0, 150);
    await env.BUCKET.put(key, bytes, { httpMetadata: { contentType: mime } });
    try {
        await database().batch([database().prepare('INSERT INTO media_items (id,scope,object_key,name,alt,mime,size,deleted,created_at) VALUES (?,?,?,?,?,?,?,0,?)').bind(id, scope, key, name, alt, mime, file.size, new Date().toISOString()), audit(p, scope, 'upload_image', 'media', id)]);
    }
    catch (e) {
        await env.BUCKET.delete(key);
        throw e;
    }
    return json({ id, url: '/api/media/' + id });
}
catch (e) {
    return failure(e);
} }
export async function DELETE(request: Request) { try {
    assertSameOrigin(request);
    const p = await principal(), b = z.object({ scope: z.string(), id: z.string().uuid() }).parse(await readBody(request));
    scopeAccess(p, b.scope);
    const d = database(), url = '/api/media/' + b.id;
    const used = await d.prepare('SELECT id FROM managed_records WHERE archived = 0 AND payload LIKE ? UNION ALL SELECT scope AS id FROM site_customizations WHERE payload LIKE ? LIMIT 1').bind('%' + url + '%', '%' + url + '%').first();
    if (used)
        throw new AccessError(409, 'This image is used in a listing or website customization. Replace it there before deleting.');
    const row = await d.prepare('SELECT object_key FROM media_items WHERE id = ? AND scope = ? AND deleted = 0').bind(b.id, b.scope).first<{
        object_key: string;
    }>();
    if (!row)
        throw new AccessError(404, 'Image not found.');
    await d.batch([d.prepare('UPDATE media_items SET deleted = 1 WHERE id = ? AND scope = ?').bind(b.id, b.scope), audit(p, b.scope, 'delete_image', 'media', b.id)]);
    await env.BUCKET?.delete(row.object_key);
    return json({ success: true });
}
catch (e) {
    return failure(e);
} }
