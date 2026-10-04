import { ArrowUpRight } from 'lucide-react';
export function StatCard({label,value,meta,icon}:{label:string;value:string|number;meta?:string;icon?:React.ReactNode}){return <div className="stat-card"><div className="stat-icon">{icon}</div><div><span>{label}</span><b>{value}</b>{meta&&<small>{meta}</small>}</div><ArrowUpRight size={17} className="stat-arrow"/></div>}
