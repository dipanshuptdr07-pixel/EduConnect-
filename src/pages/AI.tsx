import { useState } from 'react';
import { ImagePlus, Mic, Send, Sparkles, Volume2 } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { invokeStudyAI } from '../lib/api';

type Msg={role:'user'|'assistant';content:string};

export default function AI(){
 const [messages,setMessages]=useState<Msg[]>([{role:'assistant',content:'Hi! I’m Study AI. Ask me to explain a concept, solve homework step-by-step, translate a passage, or make a revision plan.'}]);
 const [text,setText]=useState('');
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');

 const send=async()=>{
  if(!text.trim()||busy)return;
  const user={role:'user' as const,content:text.trim()};
  const next=[...messages,user];
  setMessages(next);
  setText('');
  setBusy(true);
  setError('');
  try{
   const r=await invokeStudyAI(next);
   setMessages([...next,{role:'assistant',content:r.message}]);
  }catch(e){
   setError('Study AI is not configured on the server yet. Add an AI provider key to the Edge Function environment; the app never stores the key in the browser.');
  }finally{
   setBusy(false);
  }
 };

 return <>
  <PageHeader title="Study AI" subtitle="Secure provider abstraction — no API key is exposed to the browser."/>
  <div className="ai-shell">
   <div className="ai-toolbar">
    <div className="ai-title">
     <div className="ai-icon"><Sparkles/></div>
     <div>
      <b>EduConnect Study AI</b>
      <span>Provider-ready · text, image/PDF and voice architecture</span>
     </div>
    </div>
    <button className="secondary"><Volume2 size={16}/> Voice output</button>
   </div>

   <div className="chat">
    {messages.map((m,i)=>
     <div className={m.role==='user'?'bubble user':'bubble assistant'} key={i}>
      {m.content}
     </div>
    )}
    {busy&&<div className="bubble assistant">Thinking…</div>}
   </div>

   {error&&<div className="form-error">{error}</div>}

   <div className="chat-input">
    <button className="icon-btn" title="Attach image/PDF"><ImagePlus/></button>
    <button className="icon-btn" title="Voice input"><Mic/></button>
    <textarea
     value={text}
     onChange={e=>setText(e.target.value)}
     onKeyDown={e=>{
      if(e.key==='Enter'&&!e.shiftKey){
       e.preventDefault();
       send();
      }
     }}
     placeholder="Ask a study question…"
     rows={1}
    />
    <button className="send-btn" onClick={send}><Send size={18}/></button>
   </div>

   <p className="muted">
    AI answers should be checked with your teacher for graded work. Attachments and voice hooks are intentionally provider-dependent.
   </p>
  </div>
 </>
}
