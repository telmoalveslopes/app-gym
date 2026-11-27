// Supabase falso para testes: "base de dados" em localStorage['MOCKDB'] (sobrevive a recarregar a página).
// Imita as regras de segurança (RLS) de supabase/schema.sql, incluindo PT/alunos:
//  app_data: o próprio lê e escreve; o PT ligado só lê. app_backups: só o próprio.
//  profiles: sem escrita direta (só pelas funções). coach_links: criar só com join_coach; os dois lados veem e apagam.
//  coach_plans: o PT escreve para alunos ligados; o aluno só lê.
// MOCK.setRole('email','coach'|'admin'|'user') faz o papel do SQL Editor do Supabase.
(function(){
const db=()=>{const d=JSON.parse(localStorage.getItem('MOCKDB')||'{"app_data":[],"app_backups":[],"users":{}}');['profiles','coach_links','coach_plans'].forEach(k=>d[k]=d[k]||[]);return d},put=d=>localStorage.setItem('MOCKDB',JSON.stringify(d));
const sess=()=>JSON.parse(localStorage.getItem('MOCKSES')||'null');let cbs=[];const emit=(ev,s)=>cbs.forEach(c=>c(ev,s));
const R=(data,error)=>Promise.resolve(error?{data:null,error:{message:error}}:{data,error:null});
const isCoach=(d,u)=>d.profiles.some(p=>p.user_id===u&&(p.role=='coach'||p.role=='admin')),isAdmin=(d,u)=>d.profiles.some(p=>p.user_id===u&&p.role=='admin');
const linked=(d,c,s)=>isCoach(d,c)&&d.coach_links.some(l=>l.coach_id===c&&l.student_id===s);
const emailOf=(d,id)=>Object.keys(d.users).find(e=>d.users[e].id===id);
// quem pode ver cada linha
const canSee={app_data:(d,u,r)=>r.user_id===u||linked(d,u,r.user_id),app_backups:(d,u,r)=>r.user_id===u,
profiles:(d,u,r)=>r.user_id===u||d.coach_links.some(l=>(l.coach_id===u&&l.student_id===r.user_id)||(l.student_id===u&&l.coach_id===r.user_id)),
coach_links:(d,u,r)=>r.coach_id===u||r.student_id===u,coach_plans:(d,u,r)=>r.coach_id===u||r.student_id===u};
const keyOf={app_data:r=>r.user_id,app_backups:r=>r.user_id+'|'+r.day,coach_plans:r=>r.coach_id+'|'+r.student_id};
window.MOCK={fail:false,calls:[],setRole(email,role){const d=db(),u=d.users[email];if(!u)throw 'no user';const p=d.profiles.find(z=>z.user_id===u.id);if(p)p.role=role;else d.profiles.push({user_id:u.id,role,name:null,coach_code:null});put(d)}};
function q(t){const st={t,f:[],inf:[],op:'select',row:null,one:0,maybe:0};const api={
select(){return api},eq(k,v){st.f.push([k,v]);return api},in(k,v){st.inf.push([k,v]);return api},order(){return api},limit(){return api},
maybeSingle(){st.maybe=1;return api},single(){st.one=1;return api},
upsert(r){st.op='upsert';st.row=r;return api},delete(){st.op='delete';return api},
then(res,rej){MOCK.calls.push(st.op+':'+t);if(MOCK.fail)return R(null,'network').then(res,rej);
const d=db(),s=sess();if(!s)return R(null,'not authenticated').then(res,rej);const u=s.user.id;d[t]=d[t]||[];const rows=d[t];
const match=x=>st.f.every(([k,v])=>x[k]===v)&&st.inf.every(([k,v])=>v.includes(x[k]));
if(st.op=='upsert'){const r={...st.row};
 const ok=t=='app_data'||t=='app_backups'?r.user_id===u:t=='coach_plans'?r.coach_id===u&&linked(d,u,r.student_id):false;
 if(!ok)return R(null,'new row violates row-level security policy').then(res,rej);
 if(t=='app_data')r.updated_at=new Date(Date.parse(r.updated_at||Date.now())).toISOString().replace('Z','+00:00');
 if(t=='coach_plans')r.updated_at=r.updated_at||new Date().toISOString();
 const k=keyOf[t](r),i=rows.findIndex(x=>keyOf[t](x)===k);if(i>=0)rows[i]={...rows[i],...r};else rows.push(r);put(d);
 return R(st.one?r:[r]).then(res,rej)}
if(st.op=='delete'){if(t!='coach_links'&&t!='coach_plans')return R(null,'permission denied').then(res,rej);
 const del=rows.filter(x=>match(x)&&(t=='coach_links'?canSee.coach_links(d,u,x):x.coach_id===u));d[t]=rows.filter(x=>!del.includes(x));put(d);return R(del).then(res,rej)}
const out=rows.filter(x=>match(x)&&canSee[t](d,u,x));
if(st.maybe)return R(out[0]||null).then(res,rej);
if(st.one)return (out[0]?R(out[0]):R(null,'no rows')).then(res,rej);
return R(out).then(res,rej)}};return api}
// funções do servidor (as mesmas de supabase/schema.sql)
const RPC={
ensure_profile(d,u,a){let p=d.profiles.find(z=>z.user_id===u);if(!p){p={user_id:u,role:'user',name:null,coach_code:null};d.profiles.push(p)}const n=(a.p_name||'').trim().slice(0,60);if(n)p.name=n;
 if((p.role=='coach'||p.role=='admin')&&!p.coach_code)p.coach_code=Math.random().toString(16).slice(2,10).toUpperCase().padEnd(8,'0');return p},
join_coach(d,u,a){const c=d.profiles.find(p=>p.coach_code===String(a.p_code||'').trim().toUpperCase()&&(p.role=='coach'||p.role=='admin'));if(!c)throw 'invalid code';if(c.user_id===u)throw 'own code';
 if(!d.profiles.some(p=>p.user_id===u))d.profiles.push({user_id:u,role:'user',name:null,coach_code:null});if(!d.coach_links.some(l=>l.coach_id===c.user_id&&l.student_id===u))d.coach_links.push({coach_id:c.user_id,student_id:u,created_at:new Date().toISOString()});return{coach_id:c.user_id,name:c.name}},
my_students(d,u){if(!isCoach(d,u))return[];return d.coach_links.filter(l=>l.coach_id===u).map(l=>({student_id:l.student_id,name:(d.profiles.find(p=>p.user_id===l.student_id)||{}).name||null,email:emailOf(d,l.student_id),since:l.created_at}))},
my_coaches(d,u){return d.coach_links.filter(l=>l.student_id===u&&isCoach(d,l.coach_id)).map(l=>({coach_id:l.coach_id,name:(d.profiles.find(p=>p.user_id===l.coach_id)||{}).name||null,since:l.created_at}))},
admin_set_role(d,u,a){if(!isAdmin(d,u))throw 'not allowed';if(!['user','coach'].includes(a.p_role))throw 'bad role';const e=Object.keys(d.users).find(k=>k.toLowerCase()===String(a.p_email||'').trim().toLowerCase());if(!e)throw 'no user';const id=d.users[e].id;if(isAdmin(d,id))throw 'is admin';
 const p=d.profiles.find(z=>z.user_id===id);if(p)p.role=a.p_role;else d.profiles.push({user_id:id,role:a.p_role,name:null,coach_code:null});return null},
admin_list(d,u){if(!isAdmin(d,u))throw 'not allowed';return d.profiles.filter(p=>p.role!='user').map(p=>({email:emailOf(d,p.user_id),role:p.role,name:p.name,students:d.coach_links.filter(l=>l.coach_id===p.user_id).length}))}};
window.supabase={createClient(){return{
auth:{onAuthStateChange(cb){cbs.push(cb);setTimeout(()=>cb('INITIAL_SESSION',sess()),0);return{data:{subscription:{unsubscribe(){}}}}},
async signInWithPassword({email,password}){const d=db();const u=d.users[email];if(!u||u.pw!==password)return{data:{},error:{message:'Invalid login credentials'}};const s={user:{id:u.id,email}};localStorage.setItem('MOCKSES',JSON.stringify(s));emit('SIGNED_IN',s);return{data:{session:s},error:null}},
async signUp({email,password}){const d=db();if(d.users[email])return{data:{},error:{message:'User already registered'}};d.users[email]={id:'uid-'+email.replace(/\W/g,''),pw:password};put(d);return{data:{session:null,user:{email}},error:null}},
async signOut(){localStorage.removeItem('MOCKSES');emit('SIGNED_OUT',null);return{error:null}},
async resetPasswordForEmail(){return{error:null}},async updateUser(){return{error:null}}},
from:q,
async rpc(name,args){MOCK.calls.push('rpc:'+name);if(MOCK.fail)return{data:null,error:{message:'network'}};const s=sess();if(!s)return{data:null,error:{message:'not authenticated'}};const f=RPC[name];if(!f)return{data:null,error:{message:'no function'}};
 const d=db();try{const r=f(d,s.user.id,args||{});put(d);return{data:JSON.parse(JSON.stringify(r)),error:null}}catch(e){return{data:null,error:{message:String(e)}}}}}}};
})();
