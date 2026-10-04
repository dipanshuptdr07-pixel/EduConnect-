import { useEffect, useMemo, useState } from 'react';
import { Building2, GraduationCap, Layers3, Plus, RefreshCw, Save, School, ShieldCheck, Trash2, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { PageHeader } from '../components/PageHeader';
import { Modal } from '../components/Modal';
import { EmptyState } from '../components/EmptyState';
import { Badge } from '../components/Badge';

type Tab='students'|'teachers'|'classes'|'sections'|'subjects'|'assignments'|'school';
const tabs: {id:Tab;label:string;icon:any}[]=[
 {id:'students',label:'Students',icon:Users},{id:'teachers',label:'Teachers',icon:GraduationCap},
 {id:'classes',label:'Classes',icon:School},{id:'sections',label:'Sections',icon:Layers3},
 {id:'subjects',label:'Subjects',icon:ShieldCheck},{id:'assignments',label:'Assignments',icon:Layers3},
 {id:'school',label:'School profile',icon:Building2}
];

export default function SchoolManagement(){
 const {profile,school}=useAuth();
 const [tab,setTab]=useState<Tab>('students');
 const [rows,setRows]=useState<any[]>([]),[classes,setClasses]=useState<any[]>([]),[sections,setSections]=useState<any[]>([]),[teachers,setTeachers]=useState<any[]>([]),[subjects,setSubjects]=useState<any[]>([]);
 const [loading,setLoading]=useState(true),[open,setOpen]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const [form,setForm]=useState<any>({full_name:'',phone:'',password:'ChangeMe123!',admission_no:'',employee_no:'',teacher_id:'',class_id:'',section_id:'',subject_id:'',name:'',grade:'',code:'',address:'',contact_phone:'',academic_year:''});

 const loadRefs=async()=>{
  const [c,s,t,sub]=await Promise.all([
   supabase.from('classes').select('*').order('name'),
   supabase.from('sections').select('*').order('name'),
   supabase.from('teacher_profiles').select('id,employee_no,profiles(full_name)').order('employee_no'),
   supabase.from('subjects').select('*').order('name')
  ]);
  setClasses(c.data??[]);setSections(s.data??[]);setTeachers(t.data??[]);setSubjects(sub.data??[]);
 };
 const load=async()=>{
  if(!profile||profile.role!=='ADMIN')return;
  setLoading(true);setError('');
  try{
   if(tab==='students'){
    const {data,error}=await supabase.from('student_profiles').select('id,admission_no,class_id,section_id,profiles(full_name,phone,is_active)').order('admission_no');if(error)throw error;setRows(data??[]);
   } else if(tab==='teachers'){
    const {data,error}=await supabase.from('teacher_profiles').select('id,employee_no,profile_id,profiles(full_name,phone,is_active)').order('employee_no');if(error)throw error;setRows(data??[]);
   } else if(tab==='classes'){
    const {data,error}=await supabase.from('classes').select('*').order('name');if(error)throw error;setRows(data??[]);
   } else if(tab==='sections'){
    const {data,error}=await supabase.from('sections').select('*,classes(name)').order('name');if(error)throw error;setRows(data??[]);
   } else if(tab==='subjects'){
    const {data,error}=await supabase.from('subjects').select('*').order('name');if(error)throw error;setRows(data??[]);
   } else if(tab==='assignments'){
    const {data,error}=await supabase.from('teacher_assignments').select('*,teacher_profiles(employee_no,profiles(full_name)),classes(name),sections(name),subjects(name)').order('created_at');if(error)throw error;setRows(data??[]);
   } else if(tab==='school'){
    setForm((f:any)=>({...f,name:school?.name??'',address:school?.address??'',contact_phone:school?.contact_phone??'',academic_year:school?.academic_year??'',code:school?.code??''}));
   }
  }catch(e){setError(e instanceof Error?e.message:'Could not load management data.')}finally{setLoading(false)}
 };
 useEffect(()=>{load()},[tab,profile?.id]);
 useEffect(()=>{loadRefs()},[profile?.id]);
 const title=useMemo(()=>tabs.find(x=>x.id===tab)?.label??'School management',[tab]);
 const resetForm=()=>setForm({full_name:'',phone:'',password:'ChangeMe123!',admission_no:'',employee_no:'',teacher_id:'',class_id:'',section_id:'',subject_id:'',name:'',grade:'',code:'',address:school?.address??'',contact_phone:school?.contact_phone??'',academic_year:school?.academic_year??'',});
 const create=async()=>{
  if(!profile)return;setBusy(true);setError('');
  try{
   if(tab==='students'||tab==='teachers'){
    const role=tab==='students'?'STUDENT':'TEACHER';
    const payload=role==='STUDENT'
      ?{role,full_name:form.full_name,phone:form.phone,password:form.password,admission_no:form.admission_no,class_id:form.class_id||null,section_id:form.section_id||null}
      :{role,full_name:form.full_name,phone:form.phone,password:form.password,employee_no:form.employee_no};
    const {data,error}=await supabase.functions.invoke('admin-provision-user',{body:payload});if(error)throw error;if(data?.error)throw new Error(data.error);
   } else if(tab==='classes'){
    const {error}=await supabase.from('classes').insert({school_id:profile.school_id,name:form.name,grade:form.grade});if(error)throw error;
   } else if(tab==='sections'){
    const {error}=await supabase.from('sections').insert({school_id:profile.school_id,class_id:form.class_id,name:form.name});if(error)throw error;
   } else if(tab==='subjects'){
    const {error}=await supabase.from('subjects').insert({school_id:profile.school_id,name:form.name,code:form.code||null});if(error)throw error;
   } else if(tab==='assignments'){
    const {error}=await supabase.from('teacher_assignments').insert({school_id:profile.school_id,teacher_id:form.teacher_id,class_id:form.class_id,section_id:form.section_id,subject_id:form.subject_id});if(error)throw error;
   }
   setOpen(false);await load();await loadRefs();
  }catch(e){setError(e instanceof Error?e.message:'Save failed.')}finally{setBusy(false)}
 };
 const remove=async(id:string,table:string)=>{if(!confirm('Delete this record? This cannot be undone.'))return;const {error}=await supabase.from(table).delete().eq('id',id);if(error)setError(error.message);else await load()};
 const saveSchool=async()=>{if(!profile||!school)return;setBusy(true);const {error}=await supabase.from('schools').update({name:form.name,address:form.address,contact_phone:form.contact_phone,academic_year:form.academic_year}).eq('id',school.id);setBusy(false);if(error)setError(error.message);else await load()};

 const renderHead=()=>{
  if(tab==='students')return <><th>Admission</th><th>Name</th><th>Phone</th><th>Class</th><th>Status</th></>;
  if(tab==='teachers')return <><th>Employee</th><th>Name</th><th>Phone</th><th>Status</th></>;
  if(tab==='classes')return <><th>Name</th><th>Grade</th><th/></>;
  if(tab==='sections')return <><th>Section</th><th>Class</th><th/></>;
  if(tab==='assignments')return <><th>Teacher</th><th>Class</th><th>Section</th><th>Subject</th><th/></>;
  return <><th>Subject</th><th>Code</th><th/></>;
 };
 const renderRow=(r:any)=>{
  if(tab==='students')return <><td>{r.admission_no}</td><td>{r.profiles?.full_name??'—'}</td><td>{r.profiles?.phone??'—'}</td><td>{classes.find(c=>c.id===r.class_id)?.name??'—'}</td><td><Badge tone={r.profiles?.is_active?'green':'red'}>{r.profiles?.is_active?'Active':'Inactive'}</Badge></td></>;
  if(tab==='teachers')return <><td>{r.employee_no}</td><td>{r.profiles?.full_name??'—'}</td><td>{r.profiles?.phone??'—'}</td><td><Badge tone={r.profiles?.is_active?'green':'red'}>{r.profiles?.is_active?'Active':'Inactive'}</Badge></td></>;
  if(tab==='classes')return <><td>{r.name}</td><td>{r.grade}</td><td><button className="icon-btn danger" onClick={()=>remove(r.id,'classes')}><Trash2 size={16}/></button></td></>;
  if(tab==='sections')return <><td>{r.name}</td><td>{r.classes?.name??'—'}</td><td><button className="icon-btn danger" onClick={()=>remove(r.id,'sections')}><Trash2 size={16}/></button></td></>;
  if(tab==='assignments')return <><td>{r.teacher_profiles?.profiles?.full_name??'—'}</td><td>{r.classes?.name??'—'}</td><td>{r.sections?.name??'—'}</td><td>{r.subjects?.name??'—'}</td><td><button className="icon-btn danger" onClick={()=>remove(r.id,'teacher_assignments')}><Trash2 size={16}/></button></td></>;
  return <><td>{r.name}</td><td>{r.code??'—'}</td><td><button className="icon-btn danger" onClick={()=>remove(r.id,'subjects')}><Trash2 size={16}/></button></td></>;
 };
 const modalFields=()=>{
  if(tab==='students'||tab==='teachers')return <>
   <label>Full name<input value={form.full_name} onChange={e=>setForm({...form,full_name:e.target.value})}/></label>
   <label>Phone<input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="+91..."/></label>
   <label>Temporary password<input type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/></label>
   {tab==='students'?<>
    <label>Admission number<input value={form.admission_no} onChange={e=>setForm({...form,admission_no:e.target.value})}/></label>
    <label>Class<select value={form.class_id} onChange={e=>setForm({...form,class_id:e.target.value,section_id:''})}><option value="">Select class</option>{classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
    <label>Section<select value={form.section_id} onChange={e=>setForm({...form,section_id:e.target.value})}><option value="">Select section</option>{sections.filter(s=>!form.class_id||s.class_id===form.class_id).map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
   </>:<label>Employee number<input value={form.employee_no} onChange={e=>setForm({...form,employee_no:e.target.value})}/></label>}
  </>;
  if(tab==='classes')return <><label>Class name<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Class XI"/></label><label>Grade<input value={form.grade} onChange={e=>setForm({...form,grade:e.target.value})} placeholder="11"/></label></>;
  if(tab==='sections')return <><label>Class<select value={form.class_id} onChange={e=>setForm({...form,class_id:e.target.value})}><option value="">Select class</option>{classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Section name<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="A"/></label></>;
  if(tab==='assignments')return <>
   <label>Teacher<select value={form.teacher_id} onChange={e=>setForm({...form,teacher_id:e.target.value})}><option value="">Select teacher</option>{teachers.map(t=><option key={t.id} value={t.id}>{t.profiles?.full_name??t.employee_no}</option>)}</select></label>
   <label>Class<select value={form.class_id} onChange={e=>setForm({...form,class_id:e.target.value,section_id:''})}><option value="">Select class</option>{classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
   <label>Section<select value={form.section_id} onChange={e=>setForm({...form,section_id:e.target.value})}><option value="">Select section</option>{sections.filter(s=>!form.class_id||s.class_id===form.class_id).map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
   <label>Subject<select value={form.subject_id} onChange={e=>setForm({...form,subject_id:e.target.value})}><option value="">Select subject</option>{subjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
  </>;
  return <><label>Subject name<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label><label>Subject code<input value={form.code} onChange={e=>setForm({...form,code:e.target.value})} placeholder="MATH"/></label></>;
 };

 if(profile?.role!=='ADMIN')return <EmptyState title="Admin access required" text="This management center is restricted to school administrators."/>;
 return <>
  <PageHeader title="School management" subtitle="Manage your school, accounts and academic structure from one secure center." action={tab!=='school'?<button className="primary small" onClick={()=>{resetForm();setOpen(true)}}><Plus size={16}/>Add {title.endsWith('s')?title.slice(0,-1):title}</button>:undefined}/>
  <div className="admin-tabs">{tabs.map(t=>{const Icon=t.icon;return <button key={t.id} className={tab===t.id?'admin-tab active':'admin-tab'} onClick={()=>setTab(t.id)}><Icon size={16}/>{t.label}</button>})}</div>
  {error&&<div className="form-error page-error">{error}</div>}
  {tab==='school'?<div className="panel form-grid">
    <label>School code<input value={form.code} disabled/></label><label>School name<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label>
    <label>Contact phone<input value={form.contact_phone} onChange={e=>setForm({...form,contact_phone:e.target.value})}/></label><label>Academic year<input value={form.academic_year} onChange={e=>setForm({...form,academic_year:e.target.value})} placeholder="2026-27"/></label>
    <label className="span-2">Address<textarea rows={3} value={form.address} onChange={e=>setForm({...form,address:e.target.value})}/></label>
    <div className="modal-actions span-2"><button className="primary" onClick={saveSchool} disabled={busy}><Save size={16}/>Save school profile</button></div>
   </div>
  :<div className="panel table-panel"><div className="toolbar"><button className="secondary" onClick={load}><RefreshCw size={16}/>Refresh</button><span className="muted">{rows.length} record{rows.length===1?'':'s'}</span></div>
    {loading?<div className="skeleton-table">{[1,2,3,4,5].map(i=><i key={i}/>)}</div>:rows.length?<div className="table-wrap"><table><thead><tr>{renderHead()}</tr></thead><tbody>{rows.map(r=><tr key={r.id}>{renderRow(r)}</tr>)}</tbody></table></div>:<EmptyState title="No records yet" text="Use the Add button to create the first record."/>}
   </div>}
  <Modal open={open} title={`Add ${title.endsWith('s')?title.slice(0,-1):title}`} onClose={()=>setOpen(false)}><div className="form-grid">{modalFields()}</div>{error&&<div className="form-error">{error}</div>}<div className="modal-actions"><button className="secondary" onClick={()=>setOpen(false)}>Cancel</button><button className="primary" onClick={create} disabled={busy}><Save size={16}/>{busy?'Saving…':'Create'}</button></div></Modal>
 </>;
    }
