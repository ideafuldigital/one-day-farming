import BrandLogo from '@/components/BrandLogo';
import {domainTheme} from '@/lib/brand';
import {principal} from '@/lib/admin/server';
import {AccessError,assertPermission,type ClusterKey} from '@/lib/admin/policy';
import {chatGPTSignInPath,chatGPTSignOutPath} from '@/app/chatgpt-auth';
import AdminPanel from './AdminPanel';
export default async function AdminGate({cluster}:{cluster?:ClusterKey}){try{const p=await principal();if(cluster)assertPermission(p,cluster);return <AdminPanel principal={p} initialCluster={cluster??p.clusterId??'mankulam'}/>;}catch(e){if(!(e instanceof AccessError))throw e;const back=cluster?'/clusters/'+cluster+'/admin':'/admin';return <main className="admin-gate domain-site" style={domainTheme(cluster??'main')}><a className="brand" href="/"><BrandLogo/></a><span className="eyebrow">CLUSTER ADMINISTRATION</span><h1>{e.status===401?'Sign in to your workspace.':'Access is restricted.'}</h1><p>{e.message}</p>{e.status===401?<a className="button" href={chatGPTSignInPath(back)} target="_top">Sign in →</a>:<a className="button" href={chatGPTSignOutPath(back)} target="_top">Sign out / switch account</a>}<a href="/" className="text-link">Return to the website</a><p className="fine">Employees need an active cluster assignment from the site owner. Signing in alone does not grant admin privileges.</p></main>}}
