import AdminGate from '@/components/admin/AdminGate';import {clusterIds,type ClusterKey} from '@/lib/admin/policy';import {notFound} from 'next/navigation';
export const dynamic='force-dynamic';
export default async function ClusterAdmin({params}:{params:Promise<{cluster:string}>}){const {cluster}=await params;if(!clusterIds.includes(cluster as ClusterKey))notFound();return <AdminGate cluster={cluster as ClusterKey}/>}
