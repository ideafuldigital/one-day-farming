export type ClusterId = 'mankulam' | 'vattavada' | 'kanthallor';
export type Intent = 'stay' | 'packages' | 'products';
export interface Cluster {
    id: ClusterId;
    name: string;
    subdomain: string;
    elevation: string;
    climateZone: string;
    signatureCrops: string[];
    tribalHeritage?: string;
    heroImages: string[];
    tagline: string;
    description: string;
    coordinates: [
        number,
        number
    ];
    weatherWidget: {
        temp: string;
        condition: string;
        humidity: string;
        activeHarvest: string;
    };
}
export interface PriceOption {
    id: string;
    label: string;
    priceAdjustment: number;
}
export interface Variant {
    id: string;
    label: string;
    price: number;
}
export interface Stay {
    pricingOptions?: PriceOption[];
    id: string;
    clusterId: ClusterId;
    title: string;
    type: 'homestay' | 'treehouse' | 'farm_cottage';
    hostName: string;
    pricePerNight: number;
    capacity: number;
    amenities: string[];
    images: string[];
    instantBooking: boolean;
}
export interface Package {
    pricingOptions?: PriceOption[];
    id: string;
    clusterId: ClusterId;
    title: string;
    type: 'jeep_safari' | 'plantation_walk' | 'waterfall_trek';
    durationHours: number;
    driverType: string;
    pricePerVehicleOrPerson: number;
    itinerary: string[];
    image: string;
}
export interface FarmerProfile {
    id: string;
    name: string;
    clusterId: ClusterId;
    farmCoordinates: string;
    verificationStatus: 'pending';
    photo: string;
}
export interface Product {
    variants?: Variant[];
    id: string;
    clusterId: ClusterId;
    name: string;
    category: 'tea' | 'spices' | 'vegetables' | 'fruits' | 'jaggery';
    price: number;
    unit: string;
    farmerName: string;
    farmCoordinates: string;
    organicCertified: boolean;
    giTagged: boolean;
    inStock: boolean;
    image: string;
}
export interface Booking {
    id: string;
    clusterId: ClusterId;
    itemTitle: string;
    start: string;
    end: string;
    guests: number;
    total: number;
    demo: true;
    createdAt: string;
}
export interface Order {
    id: string;
    items: {
        productId: string;
        quantity: number;
    }[];
    fulfillment: 'pickup' | 'courier';
    total: number;
    demo: true;
    createdAt: string;
}
export const clusters: Cluster[] = [
    { id: 'mankulam', name: 'Mankulam', subdomain: 'mankulam.onedayfarming.com', elevation: 'Rainforest foothills', climateZone: 'Rainforest corridor', signatureCrops: ['Orthodox tea', 'Wild pepper'], tribalHeritage: 'Muduvan community heritage', heroImages: ['/images/tea.jpg', '/images/forest.jpg'], tagline: 'Where the forest meets the farm.', description: 'Follow tea trails, discover pepper vines and slow down in the rainforest corridor. A landscape shaped by farming, water and community traditions.', coordinates: [10.091, 76.988], weatherWidget: { temp: '—', condition: 'Weather unavailable', humidity: '—', activeHarvest: 'Ask your host for current harvests' } },
    { id: 'vattavada', name: 'Vattavada', subdomain: 'vattavada.onedayfarming.com', elevation: '1,800m+', climateZone: 'Cool highland terraces', signatureCrops: ['Garlic', 'Winter vegetables', 'Strawberries'], heroImages: ['/images/terraces.jpg'], tagline: 'A slower life, a little higher up.', description: 'Walk through a patchwork of mountain terraces. Discover carrots, cabbage, beans and strawberries, and the people who nurture them in the cool highlands.', coordinates: [10.185, 77.258], weatherWidget: { temp: '—', condition: 'Weather unavailable', humidity: '—', activeHarvest: 'Harvest dates vary by farm' } },
    { id: 'kanthallor', name: 'Kanthallor', subdomain: 'kanthallor.onedayfarming.com', elevation: 'Orchard country', climateZone: 'Fruit-growing highlands', signatureCrops: ['Apples', 'Plums', 'Oranges', 'Jaggery'], heroImages: ['/images/apples.jpg'], tagline: 'Good days grow on trees.', description: 'Spend time among fruit orchards and explore the journey from sugarcane to jaggery around the Marayoor boundary. Let the season guide your visit.', coordinates: [10.213, 77.191], weatherWidget: { temp: '—', condition: 'Weather unavailable', humidity: '—', activeHarvest: 'Fruit availability is seasonal' } }
];
export const getCluster = (id: string) => clusters.find(c => c.id === id);
export const stays: Stay[] = clusters.flatMap(c => [{ id: c.id + '-stay', clusterId: c.id, title: c.id === 'mankulam' ? 'Rainforest family homestay' : c.id === 'vattavada' ? 'Terrace-view farm cottage' : 'Orchard garden retreat', type: 'homestay' as const, hostName: c.name + ' community host · sample', pricePerNight: c.id === 'vattavada' ? 2800 : 2400, capacity: 4, amenities: ['Breakfast option', 'Farm surroundings', 'Local host', '2–4 guests'], images: ['/images/cottage.jpg'], instantBooking: false }, { id: c.id + '-cottage', clusterId: c.id, title: c.name + ' farm cottage', type: 'farm_cottage' as const, hostName: 'Sample farm host', pricePerNight: 3200, capacity: 6, amenities: ['Family cottage', 'Home-cooked meals', 'Nature walks'], images: [c.heroImages[0]], instantBooking: false }]);
export const packages: Package[] = clusters.flatMap(c => [{ id: c.id + '-walk', clusterId: c.id, title: c.id === 'kanthallor' ? 'Orchard to table walk' : c.id === 'vattavada' ? 'A morning on the terraces' : 'Tea trails & pepper stories', type: 'plantation_walk' as const, durationHours: 3, driverType: 'Local guide assignment pending', pricePerVehicleOrPerson: 850, itinerary: ['Meet at the village desk', 'Guided farm walk', 'Discover seasonal crops', 'Local refreshments'], image: c.heroImages[0] }, { id: c.id + '-jeep', clusterId: c.id, title: 'Highland jeep & farm trail', type: 'jeep_safari' as const, durationHours: 4, driverType: 'Licensed guide verification required before launch', pricePerVehicleOrPerson: 3600, itinerary: ['Meet your local guide', 'Scenic highland drive', 'Farm visit', 'Return to village meeting point'], image: '/images/forest.jpg' }]);
const produce: Record<ClusterId, {
    name: string;
    category: Product['category'];
    price: number;
    unit: string;
    image: string;
}[]> = { mankulam: [{ name: 'Orthodox leaf tea', category: 'tea', price: 240, unit: '250 g', image: '/images/tea.jpg' }, { name: 'Whole black pepper', category: 'spices', price: 190, unit: '100 g', image: '/images/forest.jpg' }], vattavada: [{ name: 'Seasonal vegetable basket', category: 'vegetables', price: 320, unit: '2 kg', image: '/images/vegetables.jpg' }, { name: 'Highland garlic', category: 'vegetables', price: 180, unit: '250 g', image: '/images/terraces.jpg' }], kanthallor: [{ name: 'Seasonal orchard apples', category: 'fruits', price: 220, unit: '1 kg', image: '/images/apples.jpg' }, { name: 'Traditional jaggery', category: 'jaggery', price: 160, unit: '500 g', image: '/images/terraces.jpg' }] };
export const products: Product[] = clusters.flatMap(c => produce[c.id].map((p, i) => ({ ...p, id: c.id + '-product-' + i, clusterId: c.id, farmerName: 'Sample ' + c.name + ' grower', farmCoordinates: 'Exact farm location pending verification', organicCertified: false, giTagged: false, inStock: true })));
export const money = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
