import { customization, media } from '@/lib/features/server';
import type { Customization, MediaItem } from '@/lib/features/schema';
import { env } from '@/local/runtime';
import { clusters, stays, packages, products, type Cluster, type Stay, type Package, type Product } from '@/data/clustersData';
import type { Kind } from './policy';
import { schemas } from './validation';
export interface RecordRow {
    id: string;
    cluster_id: string;
    kind: Kind;
    record_id: string;
    payload: string;
    published: number;
    archived: number;
    version: number;
    updated_at: string;
    updated_by: string;
}
export interface ManagedRecord {
    recordId: string;
    cluster: string;
    kind: Kind;
    payload: Record<string, unknown>;
    published: boolean;
    archived: boolean;
    version: number;
    updatedAt: string;
    sample: boolean;
}
export function baseline(cluster: string, kind: Kind): ManagedRecord[] { let items: Record<string, unknown>[] = []; if (kind === 'stays')
    items = stays.filter(s => s.clusterId === cluster).map(s => ({ ...s })); if (kind === 'packages')
    items = packages.filter(s => s.clusterId === cluster).map(s => ({ ...s })); if (kind === 'products')
    items = products.filter(s => s.clusterId === cluster).map(s => ({ ...s })); if (kind === 'content') {
    const c = clusters.find(c => c.id === cluster);
    if (c)
        items = [{ id: 'profile', tagline: c.tagline, description: c.description, signatureCrops: c.signatureCrops, climateZone: c.climateZone, elevation: c.elevation }];
} return items.map(p => ({ recordId: String(p.id), cluster, kind, payload: p, published: true, archived: false, version: 0, updatedAt: '', sample: true })); }
export function fromRow(r: RecordRow): ManagedRecord { return { recordId: r.record_id, cluster: r.cluster_id, kind: r.kind, payload: JSON.parse(r.payload) as Record<string, unknown>, published: !!r.published, archived: !!r.archived, version: r.version, updatedAt: r.updated_at, sample: false }; }
export interface PublicCatalog {
    clusters: Cluster[];
    stays: Stay[];
    packages: Package[];
    products: Product[];
    customizations?: Record<string, Customization>;
    media?: MediaItem[];
}
export async function publicCatalog(): Promise<PublicCatalog> {
    const original = { clusters, stays, packages, products };
    if (!env.DB)
        return original;
    const result = await env.DB.prepare("SELECT * FROM managed_records WHERE kind IN ('stays','packages','products','content')").all<RecordRow>();
    const out: PublicCatalog = { clusters: clusters.map(c => ({ ...c })), stays: [...stays], packages: [...packages], products: [...products] };
    for (const r of result.results) {
        const parsed = schemas[r.kind].safeParse(JSON.parse(r.payload));
        if (!parsed.success)
            continue;
        if (r.kind === 'content') {
            if (r.published && !r.archived)
                out.clusters = out.clusters.map(c => c.id === r.cluster_id ? { ...c, ...parsed.data } : c);
            continue;
        }
        const live = r.published && !r.archived;
        const data = { ...parsed.data, id: r.record_id, clusterId: r.cluster_id };
        if (r.kind === 'stays') {
            out.stays = out.stays.filter(x => !(x.id === r.record_id && x.clusterId === r.cluster_id));
            if (live)
                out.stays.push(data as Stay);
        }
        if (r.kind === 'packages') {
            out.packages = out.packages.filter(x => !(x.id === r.record_id && x.clusterId === r.cluster_id));
            if (live)
                out.packages.push(data as Package);
        }
        if (r.kind === 'products') {
            out.products = out.products.filter(x => !(x.id === r.record_id && x.clusterId === r.cluster_id));
            if (live)
                out.products.push(data as Product);
        }
    }
    out.customizations = Object.fromEntries(await Promise.all(['main', ...clusters.map(c => c.id)].map(async (scope) => [scope, (await customization(scope)).value])));
    out.media = await media();
    return out;
}
