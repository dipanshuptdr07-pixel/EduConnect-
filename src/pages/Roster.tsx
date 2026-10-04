import { useEffect, useState } from 'react';
import { Plus, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { PageHeader } from '../components/PageHeader';
import { Modal } from '../components/Modal';
import { EmptyState } from '../components/EmptyState';

export default function Roster({kind}:{kind:'students'|'teachers'}){
  const [rows,setRows]=useState<any[]>([]),[classes,setClasses]=useState<any[]>([]),[sections,setSections]=useState<any[]>([]),[open,setOpen]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const [form,setForm]=useState({full_name:'',phone:'',password:'',admission_no:'',employee_no:'',class_id:'',section_id:''});

  const load=async()=>{
    if(kind==='students'){
      const {data}=await supabase.from('student_profiles').select('*,profiles(full_name,phone,is_active),classes(name),sections(name)').order('admission_no');
      setRows(data??[])
    }else{
      const {data}=await supabase.from('teacher_profiles').select('*,profiles(full_name,phone,is_active)').order('employee_no');
      setRows(data??[])
    }
    const [c,s]=await Promise.all([supabase.from('classes').select('*').order('name'),supabase.from('sections').select('*').order('name')]);
    setClasses(c.data??[]);setSections(s.data??[])
  };

  useEffect(()=>{load()},[kind]);

  const save=async()=>{
    setBusy(true);setError('');
    try{
      const {data,error:e}=await supabase.functions.invoke('admin-provision-user',{body:{...form,role:kind==='students'?'STUDENT':'TEACHER'}});
      if(e)throw e;
      if(data?.error)throw new Error(data.error);
      setOpen(false);
      setForm({full_name:'',phone:'',password:'',admission_no:'',employee_no:'',class_id:'',section_id:''});
      await load()
    }catch(e){
      setError(e instanceof Error?e.message:'Could not create account.')
    }finally{
      setBusy(false)
    }
  };

  return <>
    <PageHeader title={kind==='students'?'Students':'Teachers'} subtitle={kind==='students'?'Manage student accounts, class and section assignments.':'Manage teacher accounts and employee numbers.'} action={<button className="primary small" onClick={()=>setOpen(true)}><Plus size={16}/>Add {kind==='students'?'student':'teacher'}</button>}/>

    <div className="panel table-panel">
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th><th>Phone</th><th>{kind==='students'?'Admission':'Employee'} No.</th>
              {kind==='students'&&<><th>Class</th><th>Section</th></>}<th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length?rows.map(r=>
              <tr key={r.id}>
                <td>{r.profiles?.full_name}</td>
                <td>{r.profiles?.phone}</td>
                <td>{kind==='students'?r.admission_no:r.employee_no}</td>
                {kind==='students'&&<><td>{r.classes?.name??'—'}</td><td>{r.sections?.name??'—'}</td></>}
                <td>{r.profiles?.is_active?'Active':'Inactive'}</td>
              </tr>
            ):<tr><td colSpan={kind==='students'?6:4}><EmptyState title="No accounts yet"/></td></tr>}
          </tbody>
        </table>
      </div>
    </div>

    <Modal open={open} title={`Add ${kind==='students'?'student':'teacher'}`} onClose={()=>setOpen(false)}>
      <div className="form-grid">
        <label>Full name<input value={form.full_name} onChange={e=>setForm({...form,full_name:e.target.value})}/></label>
        <label>Phone<input inputMode="tel" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></label>
        <label>Temporary password<input type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/></label>
        {kind==='students'?<>
          <label>Admission no.<input value={form.admission_no} onChange={e=>setForm({...form,admission_no:e.target.value})}/></label>
          <label>Class<select value={form.class_id} onChange={e=>setForm({...form,class_id:e.target.value})}><option value="">Select class</option>{classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
          <label>Section<select value={form.section_id} onChange={e=>setForm({...form,section_id:e.target.value})}><option value="">Select section</option>{sections.filter(s=>!form.class_id||s.class_id===form.class_id).map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
        </>:<label>Employee no.<input value={form.employee_no} onChange={e=>setForm({...form,employee_no:e.target.value})}/></label>}
      </div>
      {error&&<div className="form-error">{error}</div>}
      <div className="modal-actions">
        <button className="secondary" onClick={()=>setOpen(false)}>Cancel</button>
        <button className="primary" disabled={busy} onClick={save}><Save size={16}/>{busy?'Creating…':'Create account'}</button>
      </div>
    </Modal>
  </>
                                     }
