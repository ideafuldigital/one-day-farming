'use client';
import { useEffect, useState } from 'react';
import { type Stay, type Package, money } from '@/data/clustersData';
import type { Settings, Reservation, Service } from '@/lib/booking/engine';
import { today, addDays } from '@/lib/booking/engine';
type Slot = {
    slot: string;
    available: boolean;
    reason: string;
    remaining: number;
    total: number;
    lines: Reservation['lines'];
};
interface Inventory {
    service: Service;
    settings: Settings;
    dates: {
        date: string;
        slots: Slot[];
    }[];
}
export default function StayBookingEngine({ stay, experience }: {
    stay?: Stay;
    experience?: Package;
}) {
    const item = stay ?? experience!;
    const [data, setData] = useState<Inventory | null>(null), [guests, setGuests] = useState(2), [nights, setNights] = useState(1), [meal] = useState(false), [units, setUnits] = useState(1), [optionId, setOptionId] = useState(''), [extras, setExtras] = useState<{
        id: string;
        quantity: number;
    }[]>([]), [from, setFrom] = useState(today()), [date, setDate] = useState(''), [slot, setSlot] = useState(''), [accepted, setAccepted] = useState(false), [error, setError] = useState(''), [busy, setBusy] = useState(false), [refresh, setRefresh] = useState(0), [result, setResult] = useState<{
        booking: Omit<Reservation, 'token' | 'key'>;
        token: string;
    } | null>(null), [now, setNow] = useState(Date.now()), [key, setKey] = useState(() => crypto.randomUUID());
    useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
    useEffect(() => { let live = true; setData(null); setAccepted(false); fetch('/api/booking?' + new URLSearchParams({ cluster: item.clusterId, service: item.id, guests: String(guests), nights: String(nights), meal: String(meal), units: String(units), optionId, addons: JSON.stringify(extras), from })).then(async (r) => { const d = await r.json() as Inventory & {
        error?: string;
    }; if (!r.ok)
        throw Error(d.error); if (live)
        setData(d); }).catch(e => { if (live)
        setError(e.message); }); return () => { live = false; }; }, [item.id, item.clusterId, guests, nights, meal, units, optionId, extras, from, refresh]);
    const chosen = data?.dates.find(d => d.date === date)?.slots.find(s => s.slot === slot);
    async function action(action: 'hold' | 'confirm' | 'cancel') { setBusy(true); setError(''); try {
        const r = await fetch('/api/booking', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cluster: item.clusterId, service: item.id, action, key, id: result?.booking.id, token: result?.token, selection: { start: date, end: stay ? addDays(date, nights) : date, slot, guests, meal, units, optionId, addons: extras }, policyVersion: data?.settings.policyVersion, expectedTotal: chosen?.total }) });
        const d = await r.json() as {
            booking: Omit<Reservation, 'token' | 'key'>;
            token: string;
            error?: string;
        };
        if (!r.ok)
            throw Error(d.error);
        setResult(d);
        setRefresh(x => x + 1);
    }
    catch (e) {
        setError((e as Error).message);
        setRefresh(x => x + 1);
    }
    finally {
        setBusy(false);
    } }
    if (result) {
        const b = result.booking, expired = b.status === 'held' && b.expires <= now;
        return <div className="booking-form"><span className="badge">DEMO INVENTORY ONLY</span><h3>{b.status === 'confirmed' ? 'Demo booking confirmed' : b.status === 'cancelled' ? 'Demo booking cancelled' : expired ? 'Hold expired' : 'Capacity held for checkout'}</h3><p>{item.title}<br />{b.start}{stay ? ' → ' + b.end : ''} · {b.slot} · {b.guests} guests</p><strong>{money(b.total)}</strong><p>{b.status === 'held' && !expired ? 'Time remaining: ' + Math.ceil((b.expires - now) / 1000) + ' seconds.' : ''}</p><p className="notice">No real reservation, charge or SMS. This record affects demonstration availability only.</p><small>Reference: {b.id}</small>{error && <p role="alert" className="error">{error}</p>}{b.status === 'held' && !expired && <button className="button full" disabled={busy} onClick={() => void action('confirm')}>Confirm demo booking</button>}{b.status !== 'cancelled' && !expired && <button className="text-link" disabled={busy} onClick={() => void action('cancel')}>Cancel and release capacity</button>}{(b.status === 'cancelled' || expired) && <button className="button" onClick={() => { setResult(null); setKey(crypto.randomUUID()); setRefresh(x => x + 1); }}>Choose another date</button>}</div>;
    }
    return <div className="booking-form"><span className="badge">LIVE DEMO AVAILABILITY</span><h3>{item.title}</h3><p>See open dates and remaining capacity before choosing. All times are India time.</p><div className="form-grid"><label>Guests<input type="number" min="1" max={data?.settings.maxGuests ?? 50} value={guests} onChange={e => { setGuests(Number(e.target.value)); setKey(crypto.randomUUID()); }}/></label>{stay && <label>Nights<input type="number" min="1" max="30" value={nights} onChange={e => { setNights(Number(e.target.value)); setKey(crypto.randomUUID()); }}/></label>}<label>Show 30 days from<input type="date" min={today()} value={from} onChange={e => setFrom(e.target.value)}/></label></div>{(stay || experience?.type === 'jeep_safari') && <label>Quantity · {stay ? 'rooms / units' : 'vehicles'}<input type="number" min="1" max="20" value={units} onChange={e => { setUnits(Number(e.target.value)); setKey(crypto.randomUUID()); }}/></label>}{(item.pricingOptions ?? []).length > 0 && <label>Choose an option<select value={optionId} onChange={e => { setOptionId(e.target.value); setKey(crypto.randomUUID()); }}><option value="">Standard · seasonal rate</option>{item.pricingOptions?.map(o => <option key={o.id} value={o.id}>{o.label} · +{money(o.priceAdjustment)}</option>)}</select></label>}{data?.service.addons?.length ? <fieldset><legend>Make it your own · optional add-ons</legend>{data.service.addons.map(a => <div key={a.id}><label className="check"><input type="checkbox" checked={extras.some(x => x.id === a.id)} onChange={e => { setExtras(e.target.checked ? [...extras, { id: a.id, quantity: 1 }] : extras.filter(x => x.id !== a.id)); setKey(crypto.randomUUID()); }}/>{a.title} · {money(a.price)} / {a.basis.replaceAll('_', ' ')}</label><small>{a.description}</small>{extras.some(x => x.id === a.id) && a.maxQuantity > 1 && <label>Quantity<input type="number" min="1" max={a.maxQuantity} value={extras.find(x => x.id === a.id)?.quantity ?? 1} onChange={e => { setExtras(extras.map(x => x.id === a.id ? { ...x, quantity: Number(e.target.value) } : x)); setKey(crypto.randomUUID()); }}/></label>}</div>)}</fieldset> : null}{!data ? <p role="status">Loading availability…</p> : <><p className="fine">Open {data.settings.first} to {data.settings.last} · Max {data.settings.advance} days ahead · {data.settings.notice} hours notice. {stay ? 'Every occupied night must be available.' : ''}</p><div className="availability-grid">{data.dates.map(d => { const available = d.slots.filter(s => s.available); return <button type="button" key={d.date} disabled={!available.length} className={date === d.date ? 'selected' : ''} title={available.length ? 'Choose this date' : d.slots[0]?.reason} onClick={() => { setDate(d.date); setSlot(available[0].slot); setKey(crypto.randomUUID()); setAccepted(false); }}><strong>{new Date(d.date + 'T12:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</strong><small>{available.length ? 'From ' + money(Math.min(...available.map(s => s.total))) : d.slots[0]?.reason}</small></button>; })}</div>{date && <><h4>{date} · {stay ? 'Check-in time' : 'Available slots'}</h4><div className="slot-options">{data.dates.find(d => d.date === date)?.slots.map(s => <button type="button" key={s.slot} disabled={!s.available} className={slot === s.slot ? 'selected' : ''} onClick={() => { setSlot(s.slot); setKey(crypto.randomUUID()); }}>{s.slot}<small>{s.available ? s.remaining + ' ' + (stay ? 'units' : experience?.type === 'jeep_safari' ? 'vehicles' : 'places') + ' left' : s.reason}</small></button>)}</div></>}{chosen?.available && <><div className="booking-breakdown">{chosen.lines.map((l, i) => <div key={i}><span>{l.date} · {l.label}<small>{l.quantity} × {money(l.rate)}</small></span><strong>{money(l.total)}</strong></div>)}<div><strong>Total · no extra demo charges</strong><strong>{money(chosen.total)}</strong></div></div><p className="fine">No live tax or payment calculation. Rates are saved with the demo booking.</p><p className="notice">{data.settings.terms}</p><label className="check"><input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)}/>I accept these demo conditions (version {data.settings.policyVersion}).</label></>}</>}{error && <p role="alert" className="error">{error}</p>}<button className="button full" disabled={busy || !chosen?.available || !accepted} onClick={() => void action('hold')}>{busy ? 'Checking capacity…' : 'Hold capacity · demo checkout'}</button><p className="fine">Full or closed? Choose another enabled date above. Checkout holds expire after five minutes.</p></div>;
}
