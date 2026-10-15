// Compatibility interface for this independent local edition. No identity headers are trusted.
import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import {sessionUser} from '@/local/core.mjs';
export async function getChatGPTUser(){const user=sessionUser((await cookies()).get('odf_session')?.value);return user?{userId:String(user.userId),email:String(user.email),displayName:String(user.email),fullName:null}:null;}
export async function requireChatGPTUser(returnTo:string){const user=await getChatGPTUser();if(!user)redirect(chatGPTSignInPath(returnTo));return user;}
export function safeReturn(value:string){try{const url=new URL(value,'http://local.test');return value.startsWith('/')&&url.origin==='http://local.test'&&!['/login','/logout'].includes(url.pathname)?url.pathname+url.search:'/admin';}catch{return '/admin';}}
export const chatGPTSignInPath=(returnTo:string)=>'/login?return_to='+encodeURIComponent(safeReturn(returnTo));
export const chatGPTSignOutPath=(returnTo='/admin')=>'/logout?return_to='+encodeURIComponent(safeReturn(returnTo));
