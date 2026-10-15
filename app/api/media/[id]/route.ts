import { env } from '@/local/runtime';
import { database } from '@/lib/admin/server';
export async function GET(_request: Request, { params }: {
    params: Promise<{
        id: string;
    }>;
}) { const { id } = await params; if (!/^[a-f0-9-]{36}$/.test(id))
    return new Response(null, { status: 404 }); const r = await database().prepare('SELECT object_key,mime FROM media_items WHERE id = ? AND deleted = 0').bind(id).first<{
    object_key: string;
    mime: string;
}>(); if (!r || !env.BUCKET)
    return new Response(null, { status: 404 }); const object = await env.BUCKET.get(r.object_key); if (!object)
    return new Response(null, { status: 404 }); return new Response(object.body, { headers: { 'Content-Type': r.mime, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'public, max-age=60', 'Content-Security-Policy': "default-src 'none'" } }); }
