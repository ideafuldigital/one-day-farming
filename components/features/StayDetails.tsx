'use client';
import BrandLogo from '@/components/BrandLogo';
import {domainTheme} from '@/lib/brand';
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import type { Stay } from '@/data/clustersData';
import { money } from '@/data/clustersData';
import StayBookingEngine from '@/components/booking/StayBookingEngine';
import type { Review } from '@/lib/features/schema';
export function ImageCarousel({ images, title }: {
    images: string[];
    title: string;
}) { const [index, setIndex] = useState(0); return <div className="stay-carousel"><img src={images[index] ?? images[0]} alt={title + ' — photo ' + (index + 1)}/>{images.length > 1 && <><div className="carousel-actions"><button aria-label="Previous photo" onClick={() => setIndex((index + images.length - 1) % images.length)}>←</button><span>{index + 1} / {images.length}</span><button aria-label="Next photo" onClick={() => setIndex((index + 1) % images.length)}>→</button></div><div className="photo-thumbs">{images.map((url, i) => <button key={i} onClick={() => setIndex(i)} aria-label={'View photo ' + (i + 1)} aria-pressed={i === index}><img src={url} alt="" loading="lazy"/></button>)}</div></>}</div>; }
export default function StayDetails({ stay }: {
    stay: Stay;
}) { const [reviews, setReviews] = useState<Review[]>([]), [summary, setSummary] = useState({ count: 0, average: 0 }), [qr, setQr] = useState(''), [error, setError] = useState(''); const path = '/clusters/' + stay.clusterId + '/stay/' + stay.id + '/review'; useEffect(() => { let live = true; QRCode.toDataURL(location.origin + path, { width: 900, margin: 4, errorCorrectionLevel: 'H' }).then(v => { if (live)
    setQr(v); }).catch(() => setError('QR generation failed. Reload to retry.')); fetch('/api/reviews?' + new URLSearchParams({ cluster: stay.clusterId, stay: stay.id })).then(async (r) => { const d = await r.json() as {
    error?: string;
    reviews: Review[];
    summary: {
        count: number;
        average: number;
    };
}; if (!r.ok)
    throw Error(d.error); if (live) {
    setReviews(d.reviews);
    setSummary(d.summary);
} }).catch(e => setError(e.message)); return () => { live = false; }; }, [path, stay.id, stay.clusterId]); return <main className="stay-detail domain-site" style={domainTheme(stay.clusterId)}><a className="brand detail-brand" href={'/clusters/'+stay.clusterId}><BrandLogo/></a><a className="text-link" href={'/clusters/' + stay.clusterId + '/stay'}>← All stays</a><span className="eyebrow">STAY WITH A LOCAL HOST</span><h1>{stay.title}</h1><p>Hosted by {stay.hostName} · Up to {stay.capacity} guests per unit · From {money(stay.pricePerNight)} / night</p><ImageCarousel images={stay.images} title={stay.title}/><div className="stay-detail-grid"><section><h2>A slower kind of stay.</h2><div className="pills">{stay.amenities.map(a => <span key={a}>{a}</span>)}</div><h2>Guest ratings & reviews</h2><p>{summary.count ? Number(summary.average).toFixed(1) + ' / 5 · ' + summary.count + ' approved reviews' : 'No reviews yet. Share your experience after your visit.'}</p><a className="button" href={path}>Write a review</a>{reviews.map(r => <article className="feature-card" key={r.id}><strong>{r.name}</strong><p aria-label={r.rating + ' out of 5 stars'}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</p><p>{r.comment}</p><small>{new Date(r.created_at).toLocaleDateString('en-IN')}</small></article>)}<aside className="feature-card qr-print"><h3>Share your stay</h3><p>Scan to rate {stay.title}.</p>{qr && <img className="review-qr" src={qr} alt={'Review QR code for ' + stay.title}/>}<div className="qr-controls">{qr && <a className="button" href={qr} download={stay.id + '-review-qr.png'}>Download QR</a>}<button className="button outline" disabled={!qr} onClick={() => window.print()}>Print QR</button></div><a href={path}>{path}</a><p className="fine">This QR always opens this stay’s current review page.</p></aside>{error && <p role="alert">{error}</p>}</section><aside><StayBookingEngine stay={stay}/></aside></div></main>; }
export function ReviewForm({ stay, signedIn }: {
    stay: Stay;
    signedIn: boolean;
}) { const [rating, setRating] = useState(5), [name, setName] = useState(''), [comment, setComment] = useState(''), [message, setMessage] = useState(''), [busy, setBusy] = useState(false), [done, setDone] = useState(false); const path = '/clusters/' + stay.clusterId + '/stay/' + stay.id; async function submit(e: React.FormEvent) { e.preventDefault(); setBusy(true); try {
    const r = await fetch('/api/reviews', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cluster: stay.clusterId, stay: stay.id, rating, name, comment }) }), d = await r.json() as {
        error?: string;
        message: string;
    };
    if (!r.ok)
        throw Error(d.error);
    setMessage(d.message);
    setDone(true);
}
catch (e) {
    setMessage((e as Error).message);
}
finally {
    setBusy(false);
} } return <main className="review-page feature-card domain-site" style={domainTheme(stay.clusterId)}><a className="brand detail-brand" href={'/clusters/'+stay.clusterId}><BrandLogo/></a><a href={path}>← {stay.title}</a><h1>How was your stay?</h1><p>Share an honest review of your visit. Your display name and review will be public after moderation.</p>{!signedIn ? <a className="button" target="_top" href={'/login?return_to=' + encodeURIComponent(path + '/review')}>Sign in to review</a> : !done && <form onSubmit={submit}><label>Display name<input required minLength={2} maxLength={80} value={name} onChange={e => setName(e.target.value)}/></label><fieldset><legend>Your rating</legend><div className="rating-stars">{[1, 2, 3, 4, 5].map(n => <button type="button" key={n} aria-label={n + ' stars'} aria-pressed={rating === n} onClick={() => setRating(n)}>{n <= rating ? '★' : '☆'}</button>)}</div></fieldset><label>Your experience<textarea required minLength={10} maxLength={2000} rows={6} value={comment} onChange={e => setComment(e.target.value)}/></label><button className="button" disabled={busy}>{busy ? 'Submitting…' : 'Submit review'}</button></form>}{message && <p role="status">{message}</p>}</main>; }
