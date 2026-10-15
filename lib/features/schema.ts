import {domainAccent} from '@/lib/brand';
import { z } from 'zod';
export const scopeSchema = z.enum(['main', 'mankulam', 'vattavada', 'kanthallor']);
export const imageUrl = z.string().max(2000).refine(s => /^\/(images\/[^\s]+|api\/media\/[a-f0-9-]{36})$/.test(s) && !s.includes('..') || /^https:\/\/[^\s]+$/i.test(s), 'Use an uploaded image, bundled image or HTTPS URL.');
const short = z.string().trim().max(180), body = z.string().trim().max(4000);
export const sectionIds = ['intro', 'destinations', 'experiences', 'purpose', 'cta'] as const;
export const pageIds = ['about', 'contact', 'gallery', 'stay', 'packages', 'products'] as const;
const pageOverride = z.object({ title: short, body: body, image: z.union([z.literal(''), imageUrl]) });
export const customizationSchema = z.object({ brand: short.min(1), banner: short, heroTitle: short, heroBody: body, heroImage: z.union([z.literal(''), imageUrl]), heroButton: short, accent: z.string().regex(/^#[0-9a-fA-F]{6}$/), footer: body, pages: z.record(z.enum(pageIds), pageOverride).default({}), sections: z.array(z.object({ id: z.enum(sectionIds), enabled: z.boolean(), title: short, body: body, image: z.union([z.literal(''), imageUrl]) })).length(5) }).refine(v => new Set(v.sections.map(s => s.id)).size === 5, 'Each section must occur once.');
export type Customization = z.infer<typeof customizationSchema>;
export const defaultCustomization = (scope='main'): Customization => ({ brand: 'one day farming', banner: '', heroTitle: '', heroBody: '', heroImage: '', heroButton: '', accent: domainAccent(scope), footer: '', pages: {}, sections: sectionIds.map(id => ({ id, enabled: true, title: '', body: '', image: '' })) });
export const addonSchema = z.object({ title: short.min(1), description: body, price: z.number().int().min(0).max(1000000), basis: z.enum(['booking', 'person', 'night', 'person_night']), maxQuantity: z.number().int().min(1).max(20), enabled: z.boolean(), services: z.array(z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/)).max(100) });
export type Addon = z.infer<typeof addonSchema> & {
    id: string;
    cluster: string;
    version: number;
    deleted?: boolean;
};
export interface MediaItem {
    id: string;
    scope: string;
    url: string;
    name: string;
    alt: string;
    mime: string;
    size: number;
    created_at: string;
}
export interface Review {
    id: string;
    rating: number;
    name: string;
    comment: string;
    created_at: string;
    status: string;
    stay_id: string;
    cluster: string;
    version: number;
}
export const optionSchema = z.object({ id: z.string().regex(/^[a-zA-Z0-9_-]{1,50}$/), label: short.min(1), priceAdjustment: z.number().int().min(0).max(1000000) });
export const variantSchema = z.object({ id: z.string().regex(/^[a-zA-Z0-9_-]{1,50}$/), label: short.min(1), price: z.number().int().min(0).max(1000000) });
