import type {CSSProperties} from 'react';
/** Sampled from the centres of the four supplied JPG swatches. */
export const domainColors:Record<string,string>={main:'#7f6c4e',mankulam:'#878957',vattavada:'#e09850',kanthallor:'#bf5f51'};
export function domainAccent(scope='main',override?:string){return override&&override!=='#193e30'?override:domainColors[scope]??domainColors.main;}
function mix(hex:string,toward:number,amount:number){return '#'+[1,3,5].map(i=>Math.round(parseInt(hex.slice(i,i+2),16)*(1-amount)+toward*amount).toString(16).padStart(2,'0')).join('');}
export function domainTheme(scope='main',override?:string):CSSProperties{
 const accent=domainAccent(scope,override),rgb=[1,3,5].map(i=>parseInt(accent.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
 const luminance=.2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2];
 return {'--green':accent,'--brand':accent,'--deep':mix(accent,0,.64),'--brand-ink':mix(accent,0,.65),'--brand-soft':mix(accent,255,.9),'--brand-pale':mix(accent,255,.96),'--on-brand':1.05/(luminance+.05)>=4.5?'#ffffff':'#18150f'} as CSSProperties;
}
