'use client';
import type { Customization } from '@/lib/features/schema';
import { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowLeft, ArrowRight, Mountain, CloudSun, Pause, Play } from 'lucide-react';
import { clusters, type Cluster, type Intent } from '@/data/clustersData';
import { clusterUrl } from '@/lib/routing';
export function Weather({ cluster }: {
    cluster: Cluster;
}) { const [w, setW] = useState<{
    temperature_2m: number;
    relative_humidity_2m: number;
    time: string;
} | null>(null); useEffect(() => { let alive = true; setW(null); fetch('/api/weather?cluster=' + cluster.id).then(r => r.ok ? r.json() : null).then(d => { if (alive && d && typeof d === 'object' && 'temperature_2m' in d && typeof d.temperature_2m === 'number' && 'relative_humidity_2m' in d && typeof d.relative_humidity_2m === 'number' && 'time' in d && typeof d.time === 'string')
    setW({ temperature_2m: d.temperature_2m, relative_humidity_2m: d.relative_humidity_2m, time: d.time }); }).catch(() => { }); return () => { alive = false; }; }, [cluster.id]); return <span className="weather"><CloudSun size={22}/><span>{w ? Math.round(w.temperature_2m) + '°C · ' + w.relative_humidity_2m + '% humidity' : 'Seasonal mountain climate'}<small>{w ? 'Open-Meteo · ' + w.time.replace('T', ' ') + ' IST' : 'Live weather unavailable · plan for changing weather'}</small></span></span>; }
export default function MainHeroSlider({ cluster, onIntent, custom }: {
    cluster?: Cluster;
    custom?: Customization;
    onIntent: (i: Intent) => void;
}) { const [slide, setSlide] = useState(0); const [paused, setPaused] = useState(false); const list = cluster ? [cluster] : clusters; const current = list[slide % list.length]; useEffect(() => { if (paused || cluster || window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    return; const t = setInterval(() => setSlide(s => (s + 1) % 3), 8000); return () => clearInterval(t); }, [paused, cluster]); return <section className="hero" aria-label="Discover Idukki"><img key={current.id} className="hero-image" src={custom?.heroImage || current.heroImages[0]} alt={current.name + ' agricultural landscape'}/><div className="hero-shade"/><div className="hero-copy"><span className="eyebrow light"><span className="little-line"/>DEVIKULAM, IDUKKI · KERALA</span><h1>{custom?.heroTitle || (cluster ? cluster.tagline : <>A day on the farm.<br />A world <em>closer.</em></>)}</h1><p>{custom?.heroBody || (cluster ? cluster.description : 'Trade the everyday for earth under your feet. Discover the farms, flavours and people of Kerala’s highlands.')}</p><button className="button cream" onClick={() => onIntent('packages')}>{custom?.heroButton || (cluster ? 'Explore local experiences' : 'Find your farm experience')}<ArrowUpRight size={19}/></button><a className="hero-secondary" href={cluster ? clusterUrl(cluster.id, 'about') : '#destinations'}>{cluster ? 'Meet the community' : 'Explore our three destinations'} <ArrowRight size={16}/></a></div><div className="hero-bottom"><div><span className="eyebrow light">{String(slide + 1).padStart(2, '0')} / {cluster ? '01' : '03'} &nbsp; THE LANDSCAPE</span><strong>{current.name} <span>{current.climateZone}</span></strong></div><div className="hero-meta"><span><Mountain size={22}/>{current.elevation}</span><Weather cluster={current}/></div>{!cluster && <div className="slider-controls"><button aria-label="Previous destination" onClick={() => setSlide((slide + 2) % 3)}><ArrowLeft size={17}/></button><button aria-label={paused ? 'Resume slideshow' : 'Pause slideshow'} onClick={() => setPaused(!paused)}>{paused ? <Play size={15}/> : <Pause size={15}/>}</button><button aria-label="Next destination" onClick={() => setSlide((slide + 1) % 3)}><ArrowRight size={17}/></button></div>}</div></section>; }
