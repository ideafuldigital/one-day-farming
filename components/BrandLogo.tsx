/** The supplied SVG, with its original Gotu typeface embedded for consistent rendering. */
export default function BrandLogo({caption,name='One Day Farming'}:{caption?:string;name?:string}){
 return <span className="brand-lockup"><img className="brand-logo" src="/brand/one-day-farming.svg" width={496} height={226} alt={name}/>{caption&&<small className="brand-caption">{caption}</small>}</span>;
}
