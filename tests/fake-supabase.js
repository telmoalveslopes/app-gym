// Supabase falso para testes: "base de dados" em localStorage['MOCKDB'] (sobrevive a recarregar a página).
(function(){
const db=()=>JSON.parse(localStorage.getItem('MOCKDB')||'{"app_data":[],"app_backups":[],"users":{}}'),put=d=>localStorage.setItem('MOCKDB',JSON.stringify(d));
const sess=()=>JSON.parse(localStorage.getItem('MOCKSES')||'null');let cbs=[];const emit=(ev,s)=>cbs.forEach(c=>c(ev,s));
window.MOCK={fail:false,calls:[]};
function q(t){const st={t,f:[],op:'select',row:null,one:0,maybe:0};const api={
select(){return api},eq(k,v){st.f.push([k,v]);return api},order(){return api},limit(){return api},
maybeSingle(){st.maybe=1;return api},single(){st.one=1;return api},
upsert(r){st.op='upsert';st.row=r;return api},
then(res,rej){MOCK.calls.push(st.op+':'+t);if(MOCK.fail)return Promise.resolve({data:null,error:{message:'network'}}).then(res,rej);
const d=db();let rows=d[t];const s=sess();
if(!s)return Promise.resolve({data:null,error:{message:'not authenticated'}}).then(res,rej);
if(st.op=='upsert'){const r={...st.row};if(r.user_id!==s.user.id)return Promise.resolve({data:null,error:{message:'RLS'}}).then(res,rej);
if(t=='app_data')r.updated_at=new Date(Date.parse(r.updated_at||Date.now())).toISOString().replace('Z','+00:00');
const key=t=='app_data'?x=>x.user_id===r.user_id:x=>x.user_id===r.user_id&&x.day===r.day;const i=rows.findIndex(key);if(i>=0)rows[i]={...rows[i],...r};else rows.push(r);put(d);
return Promise.resolve({data:st.one?r:[r],error:null}).then(res,rej)}
let out=rows.filter(x=>x.user_id===s.user.id&&st.f.every(([k,v])=>x[k]===v));
if(st.maybe)return Promise.resolve({data:out[0]||null,error:null}).then(res,rej);
if(st.one)return Promise.resolve(out[0]?{data:out[0],error:null}:{data:null,error:{message:'no rows'}}).then(res,rej);
return Promise.resolve({data:out,error:null}).then(res,rej)}};return api}
window.supabase={createClient(){return{
auth:{onAuthStateChange(cb){cbs.push(cb);setTimeout(()=>cb('INITIAL_SESSION',sess()),0);return{data:{subscription:{unsubscribe(){}}}}},
async signInWithPassword({email,password}){const d=db();const u=d.users[email];if(!u||u.pw!==password)return{data:{},error:{message:'Invalid login credentials'}};const s={user:{id:u.id,email}};localStorage.setItem('MOCKSES',JSON.stringify(s));emit('SIGNED_IN',s);return{data:{session:s},error:null}},
async signUp({email,password}){const d=db();if(d.users[email])return{data:{},error:{message:'User already registered'}};d.users[email]={id:'uid-'+email.replace(/\W/g,''),pw:password};put(d);return{data:{session:null,user:{email}},error:null}},
async signOut(){localStorage.removeItem('MOCKSES');emit('SIGNED_OUT',null);return{error:null}},
async resetPasswordForEmail(){return{error:null}},async updateUser(){return{error:null}}},
from:q}}};
})();
