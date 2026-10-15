import Site from '@/components/Site';
import {publicCatalog} from '@/lib/admin/catalog';
export const dynamic='force-dynamic';
import {getCluster} from '@/data/clustersData';
import {notFound} from 'next/navigation';
export default async function Page({params}:{params:Promise<{path:string[]}>}){const {path}=await params;const catalog=await publicCatalog();
 if(path[0]==='clusters'&&path[1]){const c=getCluster(path[1]);const view=path[2]??'home';if(!c||path.length>3||!['home','stay','packages','products','about','contact','gallery'].includes(view))return notFound();return <Site clusterId={c.id} view={view} catalog={catalog}/>;}
 if(path.length===1&&['clusters','gallery','about','contact','stay','packages','products'].includes(path[0]))return <Site view={path[0]} catalog={catalog}/>;
 return notFound();
}
