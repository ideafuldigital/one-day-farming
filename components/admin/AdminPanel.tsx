'use client';
import BrandLogo from '@/components/BrandLogo';
import {domainTheme} from '@/lib/brand';
import AdminFeatures, { PricingEditor } from '@/components/features/AdminFeatures';
import BookingControls from './BookingControls';
import { useState, useEffect, useCallback } from 'react';
import { Sprout, LayoutDashboard, House, Route, ShoppingBag, CalendarDays, FileText, ShieldCheck, LogOut, ArrowUpRight, Plus, Search, RefreshCw, X, Save, Archive, Check, Users, History } from 'lucide-react';
import { clusters } from '@/data/clustersData';
import { kinds, type Principal, type Kind, type ClusterKey } from '@/lib/admin/policy';
import type { ManagedRecord } from '@/lib/admin/catalog';
import { Dialog } from 'radix-ui';
interface Member {
    id: string;
    email: string;
    cluster_id: ClusterKey;
    permissions: Kind[];
    active: number;
    version: number;
    bound: boolean;
}
interface MemberDraft {
    id?: string;
    email: string;
    cluster: ClusterKey;
    permissions: Kind[];
    active: boolean;
    version: number;
}
interface EventRow {
    action: string;
    kind: string;
    record_id: string;
    actor_email: string;
    created_at: string;
}
type Tab = Kind | 'overview' | 'access' | 'activity' | 'customize' | 'media' | 'addons' | 'reviews';
interface Field {
    key: string;
    label: string;
    type?: 'text' | 'number' | 'array' | 'textarea' | 'boolean' | 'date' | 'email';
    options?: string[];
}
const fields: Record<Kind, Field[]> = {
    stays: [{ key: 'title', label: 'Stay name' }, { key: 'type', label: 'Type', options: ['homestay', 'treehouse', 'farm_cottage'] }, { key: 'hostName', label: 'Host name' }, { key: 'pricePerNight', label: 'Price per night (₹)', type: 'number' }, { key: 'capacity', label: 'Maximum guests', type: 'number' }, { key: 'amenities', label: 'Amenities — one per line', type: 'array' }, { key: 'images', label: 'Image URLs — one per line', type: 'array' }, { key: 'instantBooking', label: 'Instant-booking flag (demo only)', type: 'boolean' }],
    packages: [{ key: 'title', label: 'Experience name' }, { key: 'type', label: 'Type', options: ['plantation_walk', 'jeep_safari', 'waterfall_trek'] }, { key: 'durationHours', label: 'Duration in hours', type: 'number' }, { key: 'driverType', label: 'Guide / operator details' }, { key: 'pricePerVehicleOrPerson', label: 'Price (₹)', type: 'number' }, { key: 'itinerary', label: 'Itinerary — one step per line', type: 'array' }, { key: 'image', label: 'Image URL' }],
    products: [{ key: 'name', label: 'Product name' }, { key: 'category', label: 'Category', options: ['tea', 'spices', 'vegetables', 'fruits', 'jaggery'] }, { key: 'price', label: 'Price (₹)', type: 'number' }, { key: 'unit', label: 'Unit / pack size' }, { key: 'farmerName', label: 'Grower name' }, { key: 'farmCoordinates', label: 'Farm coordinates / location' }, { key: 'image', label: 'Image URL' }, { key: 'inStock', label: 'In stock', type: 'boolean' }, { key: 'organicCertified', label: 'Organic certification verified', type: 'boolean' }, { key: 'giTagged', label: 'GI eligibility verified', type: 'boolean' }],
    bookings: [{ key: 'title', label: 'Stay / experience booked' }, { key: 'customerName', label: 'Customer name' }, { key: 'email', label: 'Customer email', type: 'email' }, { key: 'phone', label: 'Phone (optional)' }, { key: 'start', label: 'Start date', type: 'date' }, { key: 'end', label: 'End date', type: 'date' }, { key: 'guests', label: 'Guests', type: 'number' }, { key: 'total', label: 'Total amount (₹)', type: 'number' }, { key: 'status', label: 'Status', options: ['enquiry', 'confirmed', 'completed', 'cancelled'] }, { key: 'notes', label: 'Internal notes', type: 'textarea' }, { key: 'demo', label: 'This is a demonstration record', type: 'boolean' }],
    content: [{ key: 'tagline', label: 'Cluster headline' }, { key: 'description', label: 'Introduction', type: 'textarea' }, { key: 'signatureCrops', label: 'Signature crops — one per line', type: 'array' }, { key: 'climateZone', label: 'Landscape / climate description' }, { key: 'elevation', label: 'Elevation description' }]
};
const labels: Record<Tab, string> = { customize: 'Edit / Customize', media: 'Media gallery', addons: 'Add-ons', reviews: 'Reviews', overview: 'Overview', stays: 'Stays', packages: 'Experiences', products: 'Products', bookings: 'Bookings', content: 'Website content', access: 'Employee access', activity: 'Activity log' };
const icons = { customize: FileText, media: House, addons: Plus, reviews: Check, overview: LayoutDashboard, stays: House, packages: Route, products: ShoppingBag, bookings: CalendarDays, content: FileText, access: ShieldCheck, activity: History };
async function api<T>(url: string, body?: unknown): Promise<T> { const response = await fetch(url, { method: body === undefined ? 'GET' : 'POST', credentials: 'same-origin', cache: 'no-store', headers: body === undefined ? {} : { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) }); const d = await response.json() as T & {
    error?: string;
}; if (!response.ok)
    throw Error(d.error ?? 'The action could not be completed.'); return d; }
function defaults(kind: Kind): Record<string, unknown> { return { stays: { title: '', type: 'homestay', hostName: '', pricePerNight: 2400, capacity: 4, amenities: ['Local host'], images: ['/images/cottage.jpg'], instantBooking: false }, packages: { title: '', type: 'plantation_walk', durationHours: 3, driverType: '', pricePerVehicleOrPerson: 850, itinerary: ['Meet at the village desk'], image: '/images/terraces.jpg' }, products: { name: '', category: 'vegetables', price: 0, unit: '1 kg', farmerName: '', farmCoordinates: '', organicCertified: false, giTagged: false, inStock: true, image: '/images/vegetables.jpg' }, bookings: { title: '', customerName: '', email: '', phone: '', start: '', end: '', guests: 2, total: 0, status: 'enquiry', notes: '', demo: false }, content: { tagline: '', description: '', signatureCrops: [], climateZone: '', elevation: '' } }[kind]; }
function title(r: ManagedRecord) { return String(r.payload.title ?? r.payload.name ?? r.payload.tagline ?? r.recordId); }
export default function AdminPanel({ principal: p, initialCluster }: {
    principal: Principal;
    initialCluster: ClusterKey;
}) {
    const [cluster, setCluster] = useState<ClusterKey>(initialCluster), [tab, setTab] = useState<Tab>('overview'), [records, setRecords] = useState<ManagedRecord[]>([]), [members, setMembers] = useState<Member[]>([]), [events, setEvents] = useState<EventRow[]>([]), [counts, setCounts] = useState<Record<string, number>>({}), [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState(''), [query, setQuery] = useState(''), [showArchived, setShowArchived] = useState(false), [edit, setEdit] = useState<ManagedRecord | null>(null), [memberEdit, setMemberEdit] = useState<MemberDraft | null>(null), [pendingArchive, setPendingArchive] = useState<ManagedRecord | null>(null);
    const allowed = p.owner ? [...kinds] : p.permissions.filter(k => k !== 'content');
    const c = clusters.find(c => c.id === cluster)!;
    const refresh = useCallback(async () => { setLoading(true); setError(''); try {
        if (tab === 'access') {
            setMembers((await api<{
                members: Member[];
            }>('/api/admin/access')).members);
        }
        else if (tab === 'activity') {
            setEvents((await api<{
                events: EventRow[];
            }>('/api/admin/audit?cluster=' + cluster)).events);
        }
        else if (tab === 'overview') {
            const all = await Promise.all(allowed.map(async (kind) => { const d = await api<{
                records: ManagedRecord[];
            }>('/api/admin/records?cluster=' + cluster + '&kind=' + kind); return [kind, d.records.filter(r => !r.archived).length] as const; }));
            setCounts(Object.fromEntries(all));
        }
        else if (kinds.includes(tab as Kind)) {
            setRecords((await api<{
                records: ManagedRecord[];
            }>('/api/admin/records?cluster=' + cluster + '&kind=' + tab)).records);
        }
    }
    catch (e) {
        setError(e instanceof Error ? e.message : 'Could not load this section.');
    }
    finally {
        setLoading(false);
    } }, [cluster, tab, p.owner, p.permissions]);
    useEffect(() => { void refresh(); }, [refresh]);
    useEffect(() => { setQuery(''); setShowArchived(false); setEdit(null); setMessage(''); }, [cluster, tab]);
    async function saveRecord(r: ManagedRecord) { setBusy(true); setError(''); try {
        await api('/api/admin/records', { cluster: r.cluster, kind: r.kind, recordId: r.recordId, version: r.version, payload: r.payload, published: r.published, archived: r.archived });
        setEdit(null);
        setPendingArchive(null);
        setMessage(r.archived ? 'Record archived.' : 'Saved to the database. Published changes are visible on the website.');
        await refresh();
    }
    catch (e) {
        setError(e instanceof Error ? e.message : 'Save failed.');
    }
    finally {
        setBusy(false);
    } }
    async function saveMember(e: React.FormEvent) { e.preventDefault(); if (!memberEdit)
        return; setBusy(true); setError(''); try {
        await api('/api/admin/access', memberEdit);
        setMemberEdit(null);
        setMessage('Employee access saved. No invitation or email was sent.');
        await refresh();
    }
    catch (e) {
        setError(e instanceof Error ? e.message : 'Access update failed.');
    }
    finally {
        setBusy(false);
    } }
    function create() { if (!kinds.includes(tab as Kind))
        return; const kind = tab as Kind; setEdit({ recordId: kind === 'content' ? 'profile' : crypto.randomUUID(), cluster, kind, payload: defaults(kind), published: false, archived: false, version: 0, updatedAt: '', sample: false }); setError(''); }
    const filtered = records.filter(r => (showArchived || !r.archived) && (title(r) + ' ' + String(r.payload.customerName ?? '')).toLowerCase().includes(query.toLowerCase()));
    return <div className="admin-shell domain-site" style={domainTheme(p.owner?'main':cluster)}><aside className="admin-sidebar"><a className="brand" href="/"><BrandLogo caption="ADMIN WORKSPACE"/></a><div className="workspace-badge"><span className="eyebrow">{p.owner ? 'OWNER ACCESS' : 'YOUR CLUSTER'}</span><strong>{p.owner ? 'All cluster oversight' : c.name}</strong><small>{p.owner ? 'Manage people and permissions' : 'Access is restricted to your assigned cluster'}</small></div><nav aria-label="Administration">{(['overview', ...allowed, 'media', 'addons', ...(p.owner || allowed.includes('stays') ? ['reviews'] : []), 'activity', ...(p.owner ? ['customize', 'access'] : [])] as Tab[]).map(t => { const Icon = icons[t]; return <button key={t} className={tab === t ? 'selected' : ''} onClick={() => setTab(t)}><Icon size={18}/>{labels[t]}{t === 'access' && <span className="owner-label">OWNER</span>}</button>; })}</nav><a href="/account/password" className="text-link">Change password</a><div className="admin-account"><ShieldCheck size={19}/><div><strong>{p.owner ? 'Site owner' : 'Cluster administrator'}</strong><span>{p.email}</span></div><a href="/logout?return_to=%2Fadmin" target="_top" aria-label="Sign out"><LogOut size={17}/></a></div></aside><div className="admin-main"><header className="admin-top"><div><span className="eyebrow">ONE DAY FARMING / ADMINISTRATION</span><h1>{labels[tab]}</h1></div><div className="admin-top-actions">{p.owner ? <label>Working cluster<select value={cluster} onChange={e => setCluster(e.target.value as ClusterKey)}>{clusters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label> : <span className="badge">{c.name}</span>}<a className="admin-visit" href={'/clusters/' + cluster} target="_blank" rel="noreferrer">View website<ArrowUpRight size={16}/></a></div></header><section className="admin-body"><div className="admin-context"><span><span className="status-dot"/> {c.name} workspace</span><span><ShieldCheck size={14}/>Database-backed · permission controlled</span></div>{error && <div className="admin-alert error" role="alert">{error}<button onClick={() => void refresh()}>Reload</button></div>}{message && <div className="admin-alert success" role="status"><Check size={16}/>{message}<button aria-label="Dismiss message" onClick={() => setMessage('')}><X size={14}/></button></div>}
 {tab === 'overview' && <><div className="admin-welcome"><div><span className="eyebrow">GOOD WORK STARTS HERE</span><h2>A workspace for<br />{c.name} to grow.</h2><p>Keep your listings current, manage booking records and tell your community’s story.</p></div><Sprout size={100} strokeWidth={.7}/></div><div className="admin-stats">{allowed.map(k => { const Icon = icons[k]; return <button key={k} onClick={() => setTab(k)}><Icon size={22}/><strong>{loading ? '—' : counts[k] ?? 0}</strong><span>{labels[k]}<ArrowUpRight size={14}/></span></button>; })}</div><div className="admin-overview-grid"><article className="admin-card"><span className="eyebrow">YOUR PERMISSIONS</span><h3>{p.owner ? 'Owner oversight' : 'Your cluster, your workspace'}</h3><p>{p.owner ? 'Switch clusters above. Only your owner account can assign or revoke employee access.' : 'Your account can manage the sections shown below for ' + c.name + ' only. Other clusters are protected on the server.'}</p><div className="pills">{allowed.map(k => <span key={k}><Check size={12}/>{labels[k]}</span>)}</div>{p.owner && <button className="text-link" onClick={() => setTab('access')}>Manage employee access<ArrowUpRight size={15}/></button>}</article><article className="admin-card"><span className="eyebrow">HOW PUBLISHING WORKS</span><h3>Make every update count.</h3><ol><li>Edit a listing or add a new one.</li><li>Turn on “Visible on website” when it is ready.</li><li>Save, then check the visitor website.</li></ol><p className="fine">Booking records are internal. Visitor checkout and payments remain demonstrations; this panel does not turn them into real transactions.</p></article></div></>}
 {['customize', 'media', 'addons', 'reviews'].includes(tab) && <AdminFeatures key={tab + cluster} tab={tab} cluster={cluster} owner={p.owner}/>}
 {tab === 'bookings' && <BookingControls key={cluster} cluster={cluster}/>}
 {kinds.includes(tab as Kind) && <><div className="admin-section-heading"><div><h2>{tab === 'content' ? 'Your community’s story' : labels[tab]}</h2><p>{tab === 'bookings' ? 'Create and manage internal booking records. No automatic customer messages or charges.' : tab === 'content' ? 'Update the headline, introduction and crop information shown on your cluster website.' : 'Manage listings for ' + c.name + '. Changes are saved only to this cluster.'}</p></div>{tab !== 'content' && <button className="button" onClick={create}><Plus size={16}/>Add {tab === 'stays' ? 'stay' : tab === 'packages' ? 'experience' : tab === 'products' ? 'product' : 'booking'}</button>}</div><div className="admin-toolbar"><label className="admin-search"><Search size={17}/><input placeholder="Search this section…" value={query} onChange={e => setQuery(e.target.value)}/></label><label className="check"><input type="checkbox" checked={showArchived} onChange={e => setShowArchived(e.target.checked)}/>Include archived</label><button className="icon-btn" aria-label="Reload records" onClick={() => void refresh()}><RefreshCw size={17}/></button></div>{loading ? <div className="admin-empty" role="status">Loading records…</div> : filtered.length === 0 ? <div className="admin-empty"><FileText size={32}/><h3>No records found</h3><p>{query ? 'Try a different search.' : 'Add your first record to get started.'}</p></div> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>{tab === 'bookings' ? 'Booking / customer' : 'Name'}</th><th>Status</th><th>Updated</th><th>Actions</th></tr></thead><tbody>{filtered.map(r => <tr key={r.recordId}><td><strong>{title(r)}</strong><small>{tab === 'bookings' ? String(r.payload.customerName) + ' · ' + String(r.payload.start) : r.sample ? 'Original sample listing' : c.name + ' · ' + r.recordId.slice(0, 12)}</small></td><td><span className={'admin-status ' + (r.archived ? 'muted' : tab === 'bookings' ? 'neutral' : r.published ? 'live' : 'draft')}>{r.archived ? 'Archived' : tab === 'bookings' ? String(r.payload.status) : r.published ? 'Published' : 'Draft'}</span></td><td><small>{r.updatedAt ? new Date(r.updatedAt).toLocaleString('en-IN') : 'Not edited yet'}</small></td><td><div className="table-actions"><button onClick={() => { setEdit(r); setError(''); }}>Edit</button>{tab !== 'content' && <button onClick={() => setPendingArchive({ ...r, archived: !r.archived })}>{r.archived ? 'Restore' : 'Archive'}</button>}</div></td></tr>)}</tbody></table></div>}{tab === 'products' && <p className="fine">Only mark certifications after verifying the grower’s documentation. Images must be HTTPS URLs or bundled /images/ files.</p>}</>}
 {tab === 'access' && p.owner && <><div className="admin-section-heading"><div><h2>The right access. The right cluster.</h2><p>Assign an employee’s exact sign-in email to one cluster. New sign-ins have no privileges until you grant them.</p></div><button className="button" onClick={() => { setMemberEdit({ email: '', cluster, permissions: kinds.filter(k => k !== 'content'), active: true, version: 0 }); setError(''); }}><Plus size={16}/>Grant access</button></div><div className="notice">Create a local account with npm run user:add before assigning access here. Grants do not send invitations. Revocation blocks their next protected request. Your owner account retains access to all clusters.</div>{loading ? <div className="admin-empty">Loading employee access…</div> : !members.length ? <div className="admin-empty"><Users size={38}/><h3>No employees assigned yet</h3><p>Grant access to the employees who will manage each cluster.</p></div> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Employee</th><th>Cluster</th><th>Access</th><th>Status</th><th /></tr></thead><tbody>{members.map(m => <tr key={m.id}><td><strong>{m.email}</strong><small>{m.bound ? 'Identity linked' : 'Awaiting first sign-in'}</small></td><td>{clusters.find(c => c.id === m.cluster_id)?.name}</td><td><small>{m.permissions.map(k => labels[k]).join(', ')}</small></td><td><span className={'admin-status ' + (m.active ? 'live' : 'muted')}>{m.active ? 'Active' : 'Revoked'}</span></td><td><button className="text-link" onClick={() => { setError(''); setMemberEdit({ id: m.id, email: m.email, cluster: m.cluster_id, permissions: m.permissions, active: !!m.active, version: m.version }); }}>Manage</button></td></tr>)}</tbody></table></div>}</>}
 {tab === 'activity' && <><div className="admin-section-heading"><div><h2>A record of every change.</h2><p>Latest 100 administrative changes for {c.name}. Logs cannot be edited from this panel.</p></div><button className="icon-btn" aria-label="Reload activity" onClick={() => void refresh()}><RefreshCw size={18}/></button></div>{loading ? <div className="admin-empty">Loading activity…</div> : !events.length ? <div className="admin-empty"><History size={36}/><h3>No changes recorded yet</h3></div> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Action</th><th>Section / record</th><th>By</th><th>When</th></tr></thead><tbody>{events.map((e, i) => <tr key={i}><td>{e.action.replaceAll('_', ' ')}</td><td>{e.kind}<small>{e.record_id}</small></td><td>{e.actor_email}</td><td>{new Date(e.created_at).toLocaleString('en-IN')}</td></tr>)}</tbody></table></div>}</>}
 </section></div>
 <Dialog.Root open={!!edit} onOpenChange={v => { if (!v && !busy)
        setEdit(null); }}><Dialog.Portal><Dialog.Overlay className="overlay"/><Dialog.Content className="dialog admin-editor"><Dialog.Close disabled={busy} className="close" aria-label="Close editor"><X /></Dialog.Close><span className="eyebrow">{c.name} / {edit ? labels[edit.kind] : ''}</span><Dialog.Title>{edit?.version ? 'Edit record' : edit?.sample ? 'Edit sample listing' : 'New record'}</Dialog.Title><Dialog.Description>Changes are saved to {c.name} only. Required fields must be completed.</Dialog.Description>{edit && <form onSubmit={e => { e.preventDefault(); void saveRecord(edit); }}><div className="admin-form-grid">{fields[edit.kind].map(f => { const v = edit.payload[f.key]; const set = (value: unknown) => setEdit({ ...edit, payload: { ...edit.payload, [f.key]: value } }); return <label key={f.key} className={f.type === 'boolean' ? 'check' : f.type === 'textarea' || f.type === 'array' ? 'wide' : ''}>{f.type === 'boolean' ? <><input type="checkbox" checked={!!v} onChange={e => set(e.target.checked)}/>{f.label}</> : <>{f.label}{f.options ? <select value={String(v ?? '')} onChange={e => set(e.target.value)}>{f.options.map(o => <option key={o} value={o}>{o.replaceAll('_', ' ')}</option>)}</select> : f.type === 'array' || f.type === 'textarea' ? <textarea rows={f.type === 'array' ? 3 : 5} value={Array.isArray(v) ? v.join('\n') : String(v ?? '')} onChange={e => set(f.type === 'array' ? e.target.value.split('\n') : e.target.value)}/> : <input type={f.type ?? 'text'} required={!['phone', 'farmCoordinates'].includes(f.key)} step={f.key === 'durationHours' ? '.5' : '1'} min={f.type === 'number' ? 0 : undefined} value={String(v ?? '')} onChange={e => set(f.type === 'number' ? Number(e.target.value) : e.target.value)}/>}</>}</label>; })}</div>{['stays', 'packages', 'products'].includes(edit.kind) && <PricingEditor product={edit.kind === 'products'} value={(edit.payload[edit.kind === 'products' ? 'variants' : 'pricingOptions'] ?? []) as Record<string, unknown>[]} onChange={v => setEdit({ ...edit, payload: { ...edit.payload, [edit.kind === 'products' ? 'variants' : 'pricingOptions']: v } })}/>} {edit.kind !== 'bookings' && <label className="check admin-publish"><input type="checkbox" checked={edit.published} onChange={e => setEdit({ ...edit, published: e.target.checked })}/><span>Visible on website<small>Unpublished listings are hidden. Draft cluster content retains the original public introduction.</small></span></label>}{edit.kind === 'bookings' && <p className="notice">Internal record only. Marking a booking confirmed does not charge a customer, reserve inventory or send a notification.</p>}{error && <p className="error" role="alert">{error}</p>}<div className="admin-form-actions"><button type="button" className="text-link" disabled={busy} onClick={() => setEdit(null)}>Cancel</button><button className="button" disabled={busy}><Save size={16}/>{busy ? 'Saving…' : 'Save changes'}</button></div></form>}</Dialog.Content></Dialog.Portal></Dialog.Root>
 <Dialog.Root open={!!memberEdit} onOpenChange={v => { if (!v && !busy)
        setMemberEdit(null); }}><Dialog.Portal><Dialog.Overlay className="overlay"/><Dialog.Content className="dialog compact"><Dialog.Close disabled={busy} className="close" aria-label="Close access editor"><X /></Dialog.Close><Dialog.Title>{memberEdit?.id ? 'Manage employee access' : 'Grant cluster access'}</Dialog.Title><Dialog.Description>Only this employee’s verified sign-in account receives these permissions.</Dialog.Description>{memberEdit && <form onSubmit={saveMember}><div className="admin-form-grid"><label className="wide">Employee local account email<input required type="email" disabled={!!memberEdit.id} value={memberEdit.email} onChange={e => setMemberEdit({ ...memberEdit, email: e.target.value })}/></label><label className="wide">Assigned cluster<select value={memberEdit.cluster} onChange={e => setMemberEdit({ ...memberEdit, cluster: e.target.value as ClusterKey })}>{clusters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label></div><fieldset className="admin-permissions"><legend>Allowed sections</legend>{kinds.filter(k => k !== 'content').map(k => <label className="check" key={k}><input type="checkbox" checked={memberEdit.permissions.includes(k)} onChange={e => setMemberEdit({ ...memberEdit, permissions: e.target.checked ? [...memberEdit.permissions, k] : memberEdit.permissions.filter(x => x !== k) })}/>{labels[k]}</label>)}</fieldset><label className="check"><input type="checkbox" checked={memberEdit.active} onChange={e => setMemberEdit({ ...memberEdit, active: e.target.checked })}/>Account access active — uncheck to revoke</label>{error && <p className="error" role="alert">{error}</p>}<p className="fine">An email cannot be changed after assignment. Revoke the old grant and create a new one. No email will be sent.</p><button className="button full" disabled={busy || memberEdit.permissions.length === 0}>{busy ? 'Saving…' : 'Save access privileges'}</button></form>}</Dialog.Content></Dialog.Portal></Dialog.Root>
 <Dialog.Root open={!!pendingArchive} onOpenChange={v => { if (!v && !busy)
        setPendingArchive(null); }}><Dialog.Portal><Dialog.Overlay className="overlay"/><Dialog.Content className="dialog compact"><Dialog.Title>{pendingArchive?.archived ? 'Archive this record?' : 'Restore this record?'}</Dialog.Title><Dialog.Description>{pendingArchive?.archived ? 'It will be hidden from the public website and normal admin list. You can restore it later.' : 'It will return to the admin list. Its saved publishing status will apply.'}</Dialog.Description>{error && <p className="error">{error}</p>}<div className="admin-form-actions"><Dialog.Close disabled={busy} className="text-link">Cancel</Dialog.Close><button className="button" disabled={busy} onClick={() => pendingArchive && void saveRecord(pendingArchive)}><Archive size={16}/>{busy ? 'Saving…' : 'Confirm'}</button></div></Dialog.Content></Dialog.Portal></Dialog.Root></div>;
}
