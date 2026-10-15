import type {ClusterId,Intent} from '@/data/clustersData';
export function clusterUrl(id:ClusterId,view:string='home',intent?:Intent){
 const suffix=view==='home'?'':'/'+view;
 const query=intent?'?ref=modal&intent='+intent+'&source=devikulam_nav':'';
 return '/clusters/'+id+suffix+query;
}
export function hubUrl(){return '/';}
export function saveLocal<T>(key:string,value:T){try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{return false;}}
export function downloadText(name:string,text:string,type='text/plain'){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000);}
