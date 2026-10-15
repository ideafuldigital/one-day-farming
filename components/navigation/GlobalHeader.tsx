'use client';
import BrandLogo from '@/components/BrandLogo';
import { useState } from 'react';
import { Sprout, Menu, X, ArrowUpRight, ShoppingBag } from 'lucide-react';
import { type Cluster, type Intent } from '@/data/clustersData';
import { clusterUrl, hubUrl } from '@/lib/routing';
export default function GlobalHeader({ cluster, view, onIntent, onCart, count, brand }: {
    cluster?: Cluster;
    brand?: string;
    view: string;
    onIntent: (i: Intent) => void;
    onCart: () => void;
    count: number;
}) { const [open, setOpen] = useState(false); const nav = [['home', 'Home'], ['stay', 'Stay'], ['packages', 'Packages'], ['products', 'Products'], ['gallery', 'Gallery'], ['about', 'About Us'], ['contact', 'Contact']]; return <header className="header"><a className="brand" href={cluster ? clusterUrl(cluster.id) : hubUrl()}><BrandLogo name={brand} caption={cluster ? cluster.name.toUpperCase() + ' · KERALA' : undefined}/></a><button className="menu-toggle icon-btn" onClick={() => setOpen(!open)} aria-label="Toggle menu" aria-expanded={open}>{open ? <X /> : <Menu />}</button><nav className={open ? 'nav open' : 'nav'} aria-label="Main navigation">{nav.map(([key, label]) => { const commercial = ['stay', 'packages', 'products'].includes(key); return <a key={key} className={view === key ? 'active' : ''} href={cluster ? clusterUrl(cluster.id, key) : commercial ? '/clusters?intent=' + key : key === 'home' ? '/' : '/' + key} onClick={e => { setOpen(false); if (!cluster && commercial) {
    e.preventDefault();
    onIntent(key as Intent);
} }}>{label}</a>; })}</nav><div className="header-actions">{cluster ? <button className="icon-btn" aria-label={'Open basket, ' + count + ' items'} onClick={onCart}><ShoppingBag size={21}/>{count > 0 && <b className="cart-count">{count}</b>}</button> : <button className="button small" onClick={() => onIntent('packages')}>Plan your visit <ArrowUpRight size={16}/></button>}</div></header>; }
