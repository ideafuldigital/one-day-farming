'use client';
import {hubUrl} from '@/lib/routing';
export default function SubdomainHeaderBanner(){return <div className="hub-banner"><a href={hubUrl()}>← Back to Devikulam Taluk Hub</a><span>A community-led farm journey</span></div>}
