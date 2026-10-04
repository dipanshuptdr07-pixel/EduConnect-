import { useEffect, useState } from 'react';
import { Plus, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { PageHeader } from '../components/PageHeader';
import { Modal } from '../components/Modal';
import { Badge } from '../components/Badge';
import { EmptyState } from '../components/EmptyState';

export default function Leave(){
 const {profile}=useAuth();
 const [rows,setRows]=useState<any[]>([]),[open,setOpen]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const [form,setForm]=useState({from_date:'',to_date:'',reason:''});

 const load=async()=>{
  const {data}=await supabase.from('leave_requests').select('*').order('created_at',{ascending:false});
  setRows(data??[])
 };

 useEffect(()=>{load()},[]);

 const save=async()=>{
  setBusy(true);setError('');
  try{
   const {data:student}=await supabase.from('student_profiles').select('id').eq('profile_id',profile!.id).single();
   if(!student)throw new Error('Student profile is not configured.');
   const {error:e}=await supabase.from('leave_requests').insert({...form,school_id:profile!.school_id,student_id:student.id});
   if(e)throw e;
   setOpen(false);
   await load()
  }catch(e){
   setError(e instanceof Error?e.message:'Could not submit leave request.')
  }finally{
   setBusy(false)
  }
 };

 return <>
  <PageHeader
   title="Leave"
   subtitle={profile?.role==='STUDENT'?'Apply for leave and track status.':'Review school leave requests.'}
   action={profile?.role==='STUDENT'?<button className="primary small" onClick={()=>setOpen(true)}><Plus size={16}/>Apply leave</button>:undefined}
  />

  <div className="panel">
   <div className="list">
    {rows.length?rows.map(r=>
     <div className="list-row" key={r.id}>
      <div className="row-main">
       <b>{new Date(r.from_date).toLocaleDateString()} — {new Date(r.to_date).toLocaleDateString()}</b>
       <span>{r.reason}</span>
      </div>
      <Badge tone={r.status==='APPROVED'?'green':r.status==='REJECTED'?'red':'orange'}>
       {r.status}
      </Badge>
     </div>
    ):<EmptyState title="No leave requests"/>}
   </div>
  </div>

  <Modal open={open} title="Apply for leave" onClose={()=>setOpen(false)}>
   <div className="form-grid">
    <label>
     From
     <input type="date" value={form.from_date} onChange={e=>setForm({...form,from_date:e.target.value})}/>
    </label>
    <label>
     To
     <input type="date" value={form.to_date} onChange={e=>setForm({...form,to_date:e.target.value})}/>
    </label>
    <label className="span-2">
     Reason
     <textarea rows={5} value={form.reason} onChange={e=>setForm({...form,reason:e.target.value})}/>
    </label>
   </div>

   {error&&<div className="form-error">{error}</div>}

   <div className="modal-actions">
    <button className="secondary" onClick={()=>setOpen(false)}>Cancel</button>
    <button className="primary" onClick={save} disabled={busy}>
     <Save size={16}/>{busy?'Submitting…':'Submit request'}
    </button>
   </div>
  </Modal>
 </>
}
