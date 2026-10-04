import { Inbox } from 'lucide-react';
export function EmptyState({title='Nothing here yet',text='New items will appear here when available.'}:{title?:string;text?:string}){return <div className="empty"><Inbox size={34}/><b>{title}</b><span>{text}</span></div>}
