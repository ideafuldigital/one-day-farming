'use client';
import { useEffect, useState, useRef } from 'react';
import { pageIds, defaultCustomization, type Customization, type Addon, type MediaItem, type Review } from '@/lib/features/schema';
async function api(url: string, body?: unknown, method = 'POST') { const r = await fetch(url, { method: body === undefined ? 'GET' : method, headers: body instanceof FormData ? {} : { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body) }); const d = await r.json() as {
    error?: string;
    value: Customization;
    version: number;
    images: MediaItem[];
    addons: Addon[];
    reviews: Review[];
}; if (!r.ok)
    throw Error(d.error ?? 'Operation failed.'); return d; }
export default function AdminFeatures({ tab, cluster, owner }: {
    tab: string;
    cluster: string;
    owner: boolean;
}) {
    const loadId = useRef(0);
    const [notice, setNotice] = useState('');
    const [scope, setScope] = useState(cluster), [error, setError] = useState(''), [busy, setBusy] = useState(false), [loaded, setLoaded] = useState(false), [version, setVersion] = useState(0), [custom, setCustom] = useState<Customization>(()=>defaultCustomization(cluster)), [images, setImages] = useState<MediaItem[]>([]), [addons, setAddons] = useState<Addon[]>([]), [reviews, setReviews] = useState<Review[]>([]), [edit, setEdit] = useState<Addon | null>(null), [alt, setAlt] = useState(''), [pending, setPending] = useState<MediaItem | null>(null), [preview, setPreview] = useState<string[]>([]);
    useEffect(() => { setScope(cluster); }, [cluster]);
    async function load() { const ticket = ++loadId.current; setLoaded(false); setError(''); try {
        const url = tab === 'customize' ? '/api/admin/customize?scope=' + scope : tab === 'media' ? '/api/admin/media?scope=' + scope : '/api/admin/' + tab + '?cluster=' + cluster;
        const d = await api(url);
        if (ticket !== loadId.current)
            return;
        if (tab === 'customize') {
            setCustom(d.value);
            setVersion(d.version);
        }
        if (tab === 'media')
            setImages(d.images);
        if (tab === 'addons')
            setAddons(d.addons);
        if (tab === 'reviews')
            setReviews(d.reviews);
        setLoaded(true);
    }
    catch (e) {
        if (ticket === loadId.current)
            setError((e as Error).message);
    } }
    useEffect(() => { void load(); }, [tab, cluster, scope]);
    useEffect(() => () => preview.forEach(URL.revokeObjectURL), [preview]);
    async function act(fn: () => Promise<unknown>) { setBusy(true); setError(''); setNotice(''); try {
        await fn();
        await load();
        setNotice('Changes saved.');
    }
    catch (e) {
        setError((e as Error).message);
    }
    finally {
        setBusy(false);
    } }
    async function upload(files: FileList | null) { if (!files?.length)
        return; if (!alt.trim()) {
        setError('Enter a description before uploading.');
        return;
    } setPreview(Array.from(files).map(f => URL.createObjectURL(f))); await act(async () => { for (const file of Array.from(files)) {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024)
            throw Error('Use JPEG, PNG or WebP images up to 5 MB.');
        const body = new FormData();
        body.append('file', file);
        body.append('alt', alt.trim());
        await api('/api/admin/media?scope=' + scope, body);
    } }); setPreview([]); }
    return <div className="feature-admin">{owner && (tab === 'customize' || tab === 'media') && <label>Domain / cluster<select disabled={busy} value={scope} onChange={e => setScope(e.target.value)}>{['main', 'mankulam', 'vattavada', 'kanthallor'].map(s => <option key={s}>{s}</option>)}</select></label>}{notice && <p className="admin-alert success" role="status">{notice}</p>}{error && <p className="admin-alert error" role="alert">{error}</p>}{!loaded && <button onClick={() => void load()}>Reload panel</button>}
    {loaded && tab === 'customize' && owner && <form onSubmit={e => { e.preventDefault(); void act(() => api('/api/admin/customize', { scope, version, value: custom })); }}><p>Edit the selected website. Empty overrides retain its original content. Arrange or hide homepage sections below.</p><div className="admin-form-grid">{(['brand', 'banner', 'heroTitle', 'heroBody', 'heroImage', 'heroButton', 'accent', 'footer'] as const).map(k => <label key={k}>{k.replace(/([A-Z])/g, ' $1')}<input type={k === 'accent' ? 'color' : 'text'} value={custom[k]} onChange={e => setCustom({ ...custom, [k]: e.target.value })}/></label>)}</div><h3>Other pages</h3>{pageIds.map(page => <fieldset className="feature-card" key={page}><legend>{page}</legend>{(['title', 'body', 'image'] as const).map(key => <label key={key}>{key}<input value={custom.pages?.[page]?.[key] ?? ''} onChange={e => setCustom({ ...custom, pages: { ...custom.pages, [page]: { title: '', body: '', image: '', ...custom.pages?.[page], [key]: e.target.value } } })}/></label>)}</fieldset>)}<h3>Homepage layout</h3>{custom.sections.map((s, i) => <fieldset className="feature-card" key={s.id}><legend>{s.id}</legend><label className="check"><input type="checkbox" checked={s.enabled} onChange={e => setCustom({ ...custom, sections: custom.sections.map((v, n) => n === i ? { ...v, enabled: e.target.checked } : v) })}/>Visible</label>{(['title', 'body', 'image'] as const).map(k => <label key={k}>{k}<input value={s[k]} onChange={e => setCustom({ ...custom, sections: custom.sections.map((v, n) => n === i ? { ...v, [k]: e.target.value } : v) })}/></label>)}{[-1, 1].map(delta => <button key={delta} type="button" disabled={i + delta < 0 || i + delta >= custom.sections.length} onClick={() => { const sections = [...custom.sections]; [sections[i], sections[i + delta]] = [sections[i + delta], sections[i]]; setCustom({ ...custom, sections }); }}>{delta < 0 ? 'Move up' : 'Move down'}</button>)}</fieldset>)}<button className="button" disabled={busy}>{busy ? 'Saving…' : 'Save customization'}</button></form>}
    {loaded && tab === 'media' && <><h2>Media gallery</h2><p>Uploaded images are public. Copy their URL to use them in stays, products or website customization.</p><label>Image description<input maxLength={250} value={alt} onChange={e => setAlt(e.target.value)} placeholder="Describe the image for visitors"/></label><label className="upload-zone" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); if (!busy)
        void upload(e.dataTransfer.files); }}>Drop images here, or choose files<input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={busy} onChange={e => { void upload(e.target.files); e.target.value = ''; }}/><small>JPEG, PNG, WebP · maximum 5 MB each</small></label>{busy && <p role="status">Updating gallery…</p>}<div className="media-grid">{preview.map(u => <img key={u} src={u} alt="Upload preview"/>)}{images.map(m => <article className="feature-card" key={m.id}><img src={m.url} alt={m.alt}/><p>{m.alt}</p><input aria-label="Image URL" readOnly value={m.url} onFocus={e => e.target.select()}/><button disabled={busy} onClick={() => setPending(m)}>Delete image</button></article>)}</div>{pending && <div className="feature-card" role="alertdialog" aria-label="Confirm image deletion"><h3>Delete this image?</h3><p>{pending.alt}. Images in use cannot be deleted.</p><button disabled={busy} onClick={() => setPending(null)}>Cancel</button><button disabled={busy} onClick={() => void act(async () => { await api('/api/admin/media', { scope, id: pending.id }, 'DELETE'); setPending(null); })}>Confirm deletion</button></div>}</>}
    {loaded && tab === 'addons' && <><div className="admin-section-heading"><h2>Booking add-ons</h2><button className="button" onClick={() => setEdit({ id: crypto.randomUUID(), cluster, version: 0, title: '', description: '', price: 0, basis: 'booking', maxQuantity: 1, enabled: true, services: [] })}>Add option</button></div><p>Prices are in INR. Empty service IDs makes an add-on available for all stays and experiences in this cluster.</p>{addons.map(a => <article className="feature-card" key={a.id}><h3>{a.title}</h3><p>₹{a.price} / {a.basis.replaceAll('_', ' ')} · {a.enabled ? 'Enabled' : 'Disabled'}</p><button onClick={() => setEdit(a)}>Edit</button><button disabled={busy} onClick={() => { if (window.confirm('Delete ' + a.title + '? Existing booking prices remain unchanged.'))
        void act(() => api('/api/admin/addons', { cluster, id: a.id, version: a.version, deleted: true, value: a })); }}>Delete</button></article>)}{edit && <form className="feature-card" onSubmit={e => { e.preventDefault(); void act(async () => { await api('/api/admin/addons', { cluster, id: edit.id, version: edit.version, value: edit }); setEdit(null); }); }}><h3>{edit.version ? 'Edit' : 'New'} add-on</h3>{(['title', 'description', 'price', 'maxQuantity'] as const).map(k => <label key={k}>{k}<input required type={k === 'price' || k === 'maxQuantity' ? 'number' : 'text'} min={k === 'price' ? 0 : 1} max={k === 'maxQuantity' ? 20 : undefined} value={edit[k]} onChange={e => setEdit({ ...edit, [k]: k === 'price' || k === 'maxQuantity' ? Number(e.target.value) : e.target.value })}/></label>)}<label>Price applies per<select value={edit.basis} onChange={e => setEdit({ ...edit, basis: e.target.value as Addon['basis'] })}>{['booking', 'person', 'night', 'person_night'].map(b => <option key={b}>{b}</option>)}</select></label><label>Service IDs (comma separated, optional)<input value={edit.services.join(',')} onChange={e => setEdit({ ...edit, services: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}/></label><label className="check"><input type="checkbox" checked={edit.enabled} onChange={e => setEdit({ ...edit, enabled: e.target.checked })}/>Enabled</label><button disabled={busy} className="button">Save add-on</button><button type="button" onClick={() => setEdit(null)}>Cancel</button></form>}</>}
    {loaded && tab === 'reviews' && <><h2>Review moderation</h2><p>Approve genuine feedback, including fair criticism. Only approved reviews are public.</p>{reviews.length === 0 && <p>No reviews submitted yet.</p>}{reviews.map(r => <article className="feature-card" key={r.id}><strong>{r.name} · {r.rating}/5</strong><p>{r.stay_id} · {r.status}</p><p>{r.comment}</p>{(['approved', 'rejected'] as const).map(status => <button key={status} disabled={busy || r.status === status} onClick={() => void act(() => api('/api/admin/reviews', { cluster, id: r.id, version: r.version, status }))}>{status === 'approved' ? 'Approve' : 'Reject'}</button>)}</article>)}</>}</div>;
}
export function PricingEditor({ value, onChange, product }: {
    value: Record<string, unknown>[];
    onChange: (v: Record<string, unknown>[]) => void;
    product: boolean;
}) { const key = product ? 'price' : 'priceAdjustment'; return <fieldset className="feature-card"><legend>{product ? 'Product variants' : 'Room / experience options'}</legend><p>{product ? 'Each variant has its own price.' : 'Adjustments are added to the seasonal rate per unit or guest.'}</p>{value.map((v, i) => <div className="admin-form-grid" key={String(v.id)}><label>Label<input required value={String(v.label)} onChange={e => onChange(value.map((x, n) => n === i ? { ...x, label: e.target.value } : x))}/></label><label>{product ? 'Price' : 'Additional rate'} (₹)<input required type="number" min="0" value={Number(v[key])} onChange={e => onChange(value.map((x, n) => n === i ? { ...x, [key]: Number(e.target.value) } : x))}/></label><button type="button" onClick={() => onChange(value.filter((_, n) => n !== i))}>Remove option</button></div>)}<button type="button" disabled={value.length >= 12} onClick={() => onChange([...value, { id: crypto.randomUUID(), label: '', [key]: 0 }])}>Add option</button></fieldset>; }
