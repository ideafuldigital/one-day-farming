import Site from '@/components/Site';
import {publicCatalog} from '@/lib/admin/catalog';
export const dynamic='force-dynamic';
export default async function Page(){return <Site view="home" catalog={await publicCatalog()}/>;}
