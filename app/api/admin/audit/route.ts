import {principal,database,json,failure} from '@/lib/admin/server';
import {assertPermission} from '@/lib/admin/policy';
export const dynamic='force-dynamic';
export async function GET(request:Request){try{const p=await principal();const cluster=new URL(request.url).searchParams.get('cluster')??'';assertPermission(p,cluster);const r=await database().prepare('SELECT action,kind,record_id,actor_email,created_at FROM admin_audit WHERE cluster_id = ? ORDER BY created_at DESC LIMIT 100').bind(cluster).all();return json({events:r.results});}catch(e){return failure(e)}}
