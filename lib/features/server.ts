import {domainAccent} from '@/lib/brand';
import { database } from '@/lib/admin/server';
import { assertPermission, AccessError, type Principal } from '@/lib/admin/policy';
import { scopeSchema, defaultCustomization, type Customization, type Addon, type MediaItem } from './schema';
export function scopeAccess(p: Principal, scope: string, ownerOnly = false) { scopeSchema.parse(scope); if ((ownerOnly || scope === 'main') && !p.owner)
    throw new AccessError(403, 'Only the Super Admin can customize domain content.'); if (scope !== 'main')
    assertPermission(p, scope); }
export function audit(p: Principal, scope: string, action: string, kind: string, id: string) { return database().prepare('INSERT INTO admin_audit (id,cluster_id,actor_id,actor_email,action,kind,record_id,created_at) SELECT ?,?,?,?,?,?,?,? WHERE changes() > 0').bind(crypto.randomUUID(), scope, p.userId, p.email, action, kind, id, new Date().toISOString()); }
export async function customization(scope: string) { const r = await database().prepare('SELECT payload,version FROM site_customizations WHERE scope = ?').bind(scope).first<{
    payload: string;
    version: number;
}>(); const value=r?JSON.parse(r.payload) as Customization:defaultCustomization(scope);value.accent=domainAccent(scope,value.accent);return {value,version:r?.version??0}; }
export async function addons(cluster: string, includeDeleted = false) { const r = await database().prepare('SELECT id,cluster,payload,version,deleted FROM booking_addons WHERE cluster = ?' + (includeDeleted ? '' : ' AND deleted = 0') + ' ORDER BY updated_at DESC').bind(cluster).all<{
    id: string;
    cluster: string;
    payload: string;
    version: number;
    deleted: number;
}>(); return r.results.map(({ payload, ...row }) => ({ ...JSON.parse(payload), ...row, deleted: !!row.deleted } as Addon)); }
export async function media(scope?: string) { const r = await database().prepare('SELECT id,scope,name,alt,mime,size,created_at FROM media_items WHERE deleted = 0' + (scope ? ' AND scope = ?' : '') + ' ORDER BY created_at DESC').bind(...(scope ? [scope] : [])).all<Omit<MediaItem, 'url'>>(); return r.results.map(r => ({ ...r, url: '/api/media/' + r.id })); }
