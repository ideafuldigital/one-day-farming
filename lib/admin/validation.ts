import { z } from 'zod';
import { imageUrl, optionSchema, variantSchema } from '@/lib/features/schema';
export const text = z.string().trim().min(1).max(160);
const words = z.array(z.string().trim().min(1).max(200)).max(20);
const price = z.number().int().min(0).max(10000000);
const image = imageUrl;
export const schemas = {
    stays: z.object({ title: text, type: z.enum(['homestay', 'treehouse', 'farm_cottage']), hostName: text, pricePerNight: price, capacity: z.number().int().min(1).max(50), amenities: words, images: z.array(image).min(1).max(8), instantBooking: z.boolean(), pricingOptions: z.array(optionSchema).max(12).refine(v => new Set(v.map(x => x.id)).size === v.length, 'Option IDs must be unique').default([]) }),
    packages: z.object({ title: text, type: z.enum(['jeep_safari', 'plantation_walk', 'waterfall_trek']), durationHours: z.number().min(.5).max(168), driverType: text, pricePerVehicleOrPerson: price, itinerary: words.min(1), image, pricingOptions: z.array(optionSchema).max(12).refine(v => new Set(v.map(x => x.id)).size === v.length, 'Option IDs must be unique').default([]) }),
    products: z.object({ name: text, category: z.enum(['tea', 'spices', 'vegetables', 'fruits', 'jaggery']), price, unit: text, farmerName: text, farmCoordinates: z.string().max(250), organicCertified: z.boolean(), giTagged: z.boolean(), inStock: z.boolean(), image, variants: z.array(variantSchema).max(12).refine(v => new Set(v.map(x => x.id)).size === v.length, 'Option IDs must be unique').default([]) }),
    bookings: z.object({ title: text, customerName: text, email: z.string().email().max(254), phone: z.string().max(30), start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), guests: z.number().int().min(1).max(100), total: price, status: z.enum(['enquiry', 'confirmed', 'completed', 'cancelled']), notes: z.string().max(3000), demo: z.boolean() }).refine(b => Number.isFinite(Date.parse(b.start)) && Number.isFinite(Date.parse(b.end)) && b.end >= b.start, 'End date must be on or after the start date.'),
    content: z.object({ tagline: text, description: z.string().trim().min(1).max(3000), signatureCrops: words.min(1), climateZone: text, elevation: text }),
};
export const recordRequest = z.object({ cluster: z.enum(['mankulam', 'vattavada', 'kanthallor']), kind: z.enum(['stays', 'packages', 'products', 'bookings', 'content']), recordId: z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/), version: z.number().int().min(0), published: z.boolean(), archived: z.boolean().default(false), payload: z.unknown() });
export const memberRequest = z.object({ id: z.string().uuid().optional(), email: z.string().trim().email().max(254).transform(v => v.toLowerCase()), cluster: z.enum(['mankulam', 'vattavada', 'kanthallor']), permissions: z.array(z.enum(['stays', 'packages', 'products', 'bookings', 'content'])).min(1).max(5), active: z.boolean(), version: z.number().int().min(0) });
