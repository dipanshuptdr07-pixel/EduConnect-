import { useEffect, useState } from 'react';
import { ArrowRight, BookOpen, CalendarDays, ClipboardCheck, FileText, GraduationCap, Sparkles, Users } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { StatCard } from '../components/StatCard';
import { Badge } from '../components/Badge';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';
import { Link } from 'react-router-dom';

export default function Dashboard(){
 const {profile,school}=useAuth();
 const [loading,setLoading]=useState(true);
 const [data,setData]=useState<any>({homework:[],exams:[],notices:[],attendance:[],students:0,teachers:0});

 useEffect(()=>{
  if(!profile)return;
  let alive=true;
  (async()=>{
   try{
    const base=()=>supabase;
    const [hw,ex,not,att,sc,tc]=await Promise.all([
     base().from('homework').select('*,subjects(name)').order('due_date',{ascending:true}).limit(4),
     base().from('exams').select('*,subjects(name)').order('exam_date',{ascending:true}).limit(4),
     base().from('notices').select('*').order('publish_at',{ascending:false}).limit(4),
     base().from('attendance').select('status').limit(500),
     base().from('student_profiles').select('id',{count:'exact',head:true}),
     base().from('teacher_profiles').select('id',{count:'exact',head:true})
    ]);
    if(alive)setData({
     homework:hw.data??[],
     exams:ex.data??[],
     notices:not.data??[],
     attendance:att.data??[],
     students:sc.count??0,
     teachers:tc.count??0
    });
   }catch(e){
    console.error(e)
   }finally{
    if(alive)setLoading(false)
   }
  })();
  return()=>{alive=false}
 },[profile]);

 const present=data.attendance.filter((x:any)=>x.status==='PRESENT').length;
 const total=data.attendance.length;
 const pct=total?Math.round(present/total*100):0;

 return <>
  <PageHeader
   title={`Good morning, ${profile?.full_name?.split(' ')[0]??'there'} 👋`}
   subtitle={`${school?.name??'EduConnect'} · ${profile?.role}`}
  />

  {profile?.role==='ADMIN'
   ?<div className="stats-grid">
     <StatCard label="Students" value={data.students} meta="School-wide" icon={<Users/>}/>
     <StatCard label="Teachers" value={data.teachers} meta="Active staff" icon={<GraduationCap/>}/>
     <StatCard label="Attendance" value={total?pct+'%':'—'} meta="Recent records" icon={<ClipboardCheck/>}/>
     <StatCard label="Notices" value={data.notices.length} meta="Latest published" icon={<FileText/>}/>
    </div>
   :<div className="stats-grid">
     <StatCard label="Attendance" value={total?pct+'%':'—'} meta="Current records" icon={<ClipboardCheck/>}/>
     <StatCard label="Homework" value={data.homework.length} meta="Upcoming" icon={<BookOpen/>}/>
     <StatCard label="Exams" value={data.exams.length} meta="Upcoming" icon={<CalendarDays/>}/>
     <StatCard label="Notices" value={data.notices.length} meta="Latest" icon={<FileText/>}/>
    </div>
  }

  <div className="dashboard-grid">

   <section className="panel">
    <div className="panel-head">
     <div>
      <h2>Today's Homework</h2>
      <p>Work that needs your attention.</p>
     </div>
     <Link to="/homework">See all <ArrowRight size={15}/></Link>
    </div>

    {loading
     ?<div className="skeleton-list"><i/><i/><i/></div>
     :data.homework.length
      ?<div className="list">
       {data.homework.map((h:any)=>
        <Link className="list-row" to="/homework" key={h.id}>
         <div className="row-icon blue"><BookOpen/></div>
         <div className="row-main">
          <b>{h.title}</b>
          <span>{h.subjects?.name??'Subject'} · Due {new Date(h.due_date).toLocaleDateString()}</span>
         </div>
         <Badge tone={new Date(h.due_date)<new Date()?'red':'green'}>
          {new Date(h.due_date)<new Date()?'Overdue':'Pending'}
         </Badge>
        </Link>
       )}
      </div>
      :<EmptyState/>
    }
   </section>

   <section className="panel">
    <div className="panel-head">
     <div>
      <h2>Upcoming Exams</h2>
      <p>Plan your study schedule.</p>
     </div>
     <Link to="/exams">See all <ArrowRight size={15}/></Link>
    </div>

    {data.exams.length
     ?<div className="list">
       {data.exams.map((e:any)=>
        <Link className="list-row" to="/exams" key={e.id}>
         <div className="date-box">
          <b>{new Date(e.exam_date).getDate()}</b>
          <span>{new Date(e.exam_date).toLocaleString('en',{month:'short'})}</span>
         </div>
         <div className="row-main">
          <b>{e.name}</b>
          <span>{e.subjects?.name??'Subject'} · {e.start_time?.slice(0,5)}</span>
         </div>
         <ArrowRight size={17}/>
        </Link>
       )}
      </div>
     :<EmptyState title="No upcoming exams"/>
    }
   </section>

   <section className="panel wide">
    <div className="panel-head">
     <div>
      <h2>Notices</h2>
      <p>Important school communication.</p>
     </div>
     <Link to="/notifications">Notifications <ArrowRight size={15}/></Link>
    </div>

    {data.notices.length
     ?<div className="notice-grid">
       {data.notices.map((n:any)=>
        <div className="notice-card" key={n.id}>
         <div className="notice-top">
          <Badge tone={n.priority==='URGENT'?'red':n.priority==='HIGH'?'orange':'blue'}>
           {n.priority}
          </Badge>
          <span>{new Date(n.publish_at).toLocaleDateString()}</span>
         </div>
         <h3>{n.title}</h3>
         <p>{n.body}</p>
        </div>
       )}
      </div>
     :<EmptyState title="No notices yet"/>
    }
   </section>
  </div>

  <div className="ai-banner">
   <div className="ai-icon"><Sparkles/></div>
   <div>
    <b>Study AI</b>
    <p>Ask for a concept explanation, step-by-step homework help, translation, or revision plan.</p>
   </div>
   <Link className="primary small" to="/ai">
    Open AI <ArrowRight size={16}/>
   </Link>
  </div>
 </>
     }
