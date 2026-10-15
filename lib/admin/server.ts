import {env} from '@/local/runtime';
import {getChatGPTUser} from '@/app/chatgpt-auth';
import {AccessError,type Principal,type ClusterKey,type Kind,kinds} from './policy';
export function database(){if(!env.DB)throw new AccessError(503,'The admin database is not available.');return env.DB;}
export interface MemberRow{id:string;email:string;user_id:string|null;cluster_id:ClusterKey;permissions:string;active:number;version:number;created_at:string;updated_at:string}
export async function principal():Promise<Principal>{
 const user=await getChatGPTUser();if(!user)throw new AccessError(401,'Sign in to access administration.');
 const email=user.email.trim().toLowerCase();
 const owner=env.ADMIN_OWNER_EMAIL?.trim().toLowerCase();
 if(owner&&email===owner)return {userId:user.userId,email,owner:true,clusterId:null,permissions:[...kinds]};
 const db=database();let row=await db.prepare('SELECT * FROM admin_members WHERE email = ? AND active = 1').bind(email).first<MemberRow>();
 if(!row)throw new AccessError(403,'No active cluster access is assigned to this account. Ask the site owner to grant access.');
 if(!row.user_id){await db.prepare('UPDATE admin_members SET user_id = ? WHERE id = ? AND user_id IS NULL AND active = 1').bind(user.userId,row.id).run();row=await db.prepare('SELECT * FROM admin_members WHERE id = ? AND active = 1').bind(row.id).first<MemberRow>();}
 if(!row||row.user_id!==user.userId)throw new AccessError(403,'Account identity does not match this access grant.');
 return {userId:user.userId,email,owner:false,clusterId:row.cluster_id,permissions:(JSON.parse(row.permissions) as string[]).filter((p):p is Kind=>kinds.includes(p as Kind))};
}
export const privateHeaders={'Cache-Control':'no-store, private','Vary':'Cookie','X-Content-Type-Options':'nosniff'};
export function json(data:unknown,status=200){return Response.json(data,{status,headers:privateHeaders});}
export function failure(e:unknown){if(e instanceof AccessError)return json({error:e.message},e.status);if(e&&typeof e==='object'&&'issues' in e)return json({error:'Please check all fields. Invalid or missing values.'},400);console.error('Admin operation failed',e instanceof Error?e.name:'Error');return json({error:'Unable to complete this action. Refresh and try again.'},500);}
export async function readBody(request:Request){const body=await request.text();if(body.length>32768)throw new AccessError(413,'Request is too large.');try{return JSON.parse(body) as unknown}catch{throw new AccessError(400,'Invalid JSON.')}}
