'use client';
import { useState } from 'react';
import { Plus, Minus, Trash2, Leaf, ArrowRight, ShoppingBag, CheckCircle } from 'lucide-react';
import { Dialog } from 'radix-ui';
import { products, type Product, type ClusterId, type Order, money } from '@/data/clustersData';
import { downloadText, saveLocal } from '@/lib/routing';
export interface CartLine {
    id: string;
    quantity: number;
    variantId?: string;
}
export function FarmProductStore({ clusterId, add, productData = products }: {
    clusterId: ClusterId;
    add: (p: Product, variantId?: string, quantity?: number) => void;
    productData?: Product[];
}) { const [trace, setTrace] = useState<Product | null>(null); const [options, setOptions] = useState<Record<string, string>>({}), [quantities, setQuantities] = useState<Record<string, number>>({}); return <><div className="product-grid">{productData.filter(p => p.clusterId === clusterId).map(p => <article className="product-card" key={p.id}><div className="product-photo"><img src={p.image} alt={p.name + ' illustrative photograph'}/><span className="image-caption">Illustrative produce</span></div><div className="product-body"><span className="eyebrow">{p.category}</span><h3>{p.name}</h3><p>{p.unit} · {p.inStock ? 'In stock' : 'Unavailable'}</p><button className="text-link" onClick={() => setTrace(p)}><Leaf size={14}/>View grower & origin</button><label>Option<select aria-label={p.name + ' option'} value={options[p.id] ?? ''} onChange={e => setOptions({ ...options, [p.id]: e.target.value })}><option value="">{p.unit} · {money(p.price)}</option>{p.variants?.map(v => <option key={v.id} value={v.id}>{v.label} · {money(v.price)}</option>)}</select></label><label>Quantity<input type="number" min="1" max="10" value={quantities[p.id] ?? 1} onChange={e => setQuantities({ ...quantities, [p.id]: Math.max(1, Math.min(10, Number(e.target.value) || 1)) })}/></label><div className="product-price"><strong>{money((p.variants?.find(v => v.id === options[p.id])?.price ?? p.price) * (quantities[p.id] ?? 1))}</strong><button className="button small" disabled={!p.inStock} onClick={() => add(p, options[p.id] || undefined, quantities[p.id] ?? 1)}><Plus size={15}/>{p.inStock ? 'Add to basket' : 'Unavailable'}</button></div></div></article>)}</div><Dialog.Root open={!!trace} onOpenChange={v => !v && setTrace(null)}><Dialog.Portal><Dialog.Overlay className="overlay"/><Dialog.Content className="dialog compact"><Dialog.Title>From this farming community</Dialog.Title><Dialog.Description>Traceability preview for {trace?.name}</Dialog.Description><h3>{trace?.farmerName}</h3><p>{trace?.farmCoordinates}</p><p>{trace?.organicCertified ? 'Organic certification recorded by the cluster administrator.' : 'Organic certification is not recorded.'} {trace?.giTagged ? 'GI eligibility recorded by the cluster administrator.' : 'GI eligibility is not recorded.'} Contact the local cluster desk for supporting grower documentation.</p><Dialog.Close className="button">Close details</Dialog.Close></Dialog.Content></Dialog.Portal></Dialog.Root></>; }
export function Cart({ lines, setLines, productData = products }: {
    lines: CartLine[];
    setLines: (l: CartLine[]) => void;
    productData?: Product[];
}) { const [fulfillment, setFulfillment] = useState<'pickup' | 'courier'>('pickup'); const [complete, setComplete] = useState<Order | null>(null), [error, setError] = useState(''), [busy, setBusy] = useState(false); const rate = (p: Product, l: CartLine) => p.variants?.find(v => v.id === l.variantId)?.price ?? p.price; const same = (a: CartLine, b: CartLine) => a.id === b.id && a.variantId === b.variantId; const entries = lines.map(l => ({ line: l, product: productData.find(p => p.id === l.id)! })).filter(e => e.product && e.product.inStock); const subtotal = entries.reduce((s, e) => s + rate(e.product, e.line) * e.line.quantity, 0); const shipping = fulfillment === 'courier' && subtotal ? 120 : 0; async function finish(e: React.FormEvent) { e.preventDefault(); setBusy(true); setError(''); try {
    const response = await fetch('/api/shop/quote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lines: entries.map(e => e.line), fulfillment }) });
    const quote = await response.json() as {
        error?: string;
        total: number;
    };
    if (!response.ok)
        throw Error(quote.error);
    if (quote.total !== subtotal + shipping)
        throw Error('Prices changed. Reload the shop to review current prices.');
    const order: Order = { id: 'DEMO-ORDER-' + crypto.randomUUID().slice(0, 8), items: entries.map(({ line: l }) => ({ productId: l.id, quantity: l.quantity, variantId: l.variantId })), fulfillment, total: subtotal + shipping, demo: true, createdAt: new Date().toISOString() };
    saveLocal('odf-last-order', order);
    setComplete(order);
    setLines([]);
}
catch (e) {
    setError((e as Error).message);
}
finally {
    setBusy(false);
} } if (complete)
    return <div className="voucher"><CheckCircle size={36}/><h3>Demo order prepared</h3><p>{complete.id}</p><p>No payment was taken, no goods were ordered and no SMS was sent.</p><button className="button" onClick={() => downloadText('demo-order.json', JSON.stringify(complete, null, 2), 'application/json')}>Download demo order</button></div>; if (!entries.length)
    return <div className="empty"><ShoppingBag size={42}/><h3>Your basket is waiting for a little goodness.</h3><p>Add produce from a cluster’s farm shop to begin.</p></div>; return <form onSubmit={finish}><div className="cart-lines">{entries.map(({ product: p, line: l }) => <div className="cart-line" key={p.id + (l.variantId ?? '')}><img src={p.image} alt=""/><div><strong>{p.name}</strong><small>{p.variants?.find(v => v.id === l.variantId)?.label ?? p.unit} · {money(rate(p, l))}</small><div className="quantity"><button type="button" aria-label={'Reduce ' + p.name} onClick={() => setLines(lines.flatMap(x => same(x, l) ? (x.quantity > 1 ? [{ ...x, quantity: x.quantity - 1 }] : []) : [x]))}><Minus size={14}/></button><span>{l.quantity}</span><button type="button" disabled={l.quantity >= 10} aria-label={'Increase ' + p.name} onClick={() => setLines(lines.map(x => same(x, l) ? { ...x, quantity: x.quantity + 1 } : x))}><Plus size={14}/></button></div></div><button className="icon-btn" type="button" aria-label={'Remove ' + p.name} onClick={() => setLines(lines.filter(x => !same(x, l)))}><Trash2 size={17}/></button></div>)}</div><fieldset><legend>How would you like to receive it?</legend><label className="check"><input type="radio" name="fulfillment" checked={fulfillment === 'pickup'} onChange={() => setFulfillment('pickup')}/>Munnar collection point · free</label><label className="check"><input type="radio" name="fulfillment" checked={fulfillment === 'courier'} onChange={() => setFulfillment('courier')}/>All-India courier · sample fee ₹120</label></fieldset>{fulfillment === 'courier' && <div className="form-grid"><label>Delivery address<textarea required minLength={10} placeholder="Use a sample address for this demo"/></label><label>PIN code<input required pattern="[1-9][0-9]{5}" inputMode="numeric" maxLength={6} placeholder="6-digit PIN"/></label></div>}<p className="fine">{fulfillment === 'pickup' ? 'The exact collection counter and pickup time will require confirmation at launch.' : 'Delivery coverage and tracking are not connected in this demo.'}</p><div className="price-summary"><span>Total<small>Products {money(subtotal)} + delivery {money(shipping)}</small></span><strong>{money(subtotal + shipping)}</strong></div><div className="settlement"><Leaf size={19}/><p><strong>Direct-to-community model</strong><br />Simulated allocation: {money(subtotal)} to participating growers; {money(shipping)} to delivery. Payment processing costs are not modelled.</p></div><p role="alert">{error}</p><button disabled={busy} className="button full">{busy ? 'Checking prices…' : 'Create demo order'}<ArrowRight size={17}/></button><p className="fine">No payment details required. No real order or SMS will be sent.</p></form>; }
