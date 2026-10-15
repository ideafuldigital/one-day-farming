import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'One Day Farming | Rooted in Idukki',description:'Discover farm stays, community experiences and seasonal produce across Mankulam, Vattavada and Kanthallor in Kerala.',icons:{icon:'/favicon.svg'}};
export default function Layout({children}:Readonly<{children:React.ReactNode}>){return <html lang="en"><body>{children}</body></html>}
