import { notFound } from 'next/navigation';
import { publicCatalog } from '@/lib/admin/catalog';
import StayDetails from '@/components/features/StayDetails';
export const dynamic = 'force-dynamic';
export default async function Page({ params }: {
    params: Promise<{
        cluster: string;
        stay: string;
    }>;
}) { const p = await params, s = (await publicCatalog()).stays.find(s => s.clusterId === p.cluster && s.id === p.stay); if (!s)
    notFound(); return <StayDetails stay={s}/>; }
