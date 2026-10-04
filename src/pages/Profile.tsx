import { useState } from 'react';
import { Save } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Badge } from '../components/Badge';

export default function Profile(){
 const {profile,school}=useAuth();
 const [name,setName]=useState(profile?.full_name??'');
 const [saved,setSaved]=useState(false);
 const save=async()=>{
  if(!profile)return;
  await supabase.from('profiles').update({full_name:name}).eq('id',profile.id);
  setSaved(true);
  setTimeout(()=>setSaved(false),1500)
 };
 return <><PageHeader title="Profile" subtitle="Your school-scoped account details."/><div className="profile-grid"><section className="panel profile-card"><div className="profile-avatar">{name.slice(0,1).toUpperCase()}</div><h2>{name}</h2><Badge>{profile?.role}</Badge><p>{school?.name} · {school?.code}</p></section><section className="panel"><h2>Account information</h2><div className="form-grid"><label>Full name<input value={name} onChange={e=>setName(e.target.value)}/></label><label>Phone<input value={profile?.phone??''} disabled/></label><label>Role<input value={profile?.role??''} disabled/></label><label>School<input value={school?.name??''} disabled/></label></div><button className="primary" onClick={save}><Save size={16}/>{saved?'Saved':'Save changes'}</button></section></div></>
}
