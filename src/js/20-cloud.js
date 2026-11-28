// ===== Base de dados na nuvem (Supabase) =====
// Cada pessoa tem conta (email + password). Os dados dessa pessoa ficam numa linha da tabela app_data
// (protegida: só o próprio a pode ler/escrever) e há uma cópia por dia na tabela app_backups.
// Funciona sem rede: grava sempre primeiro no aparelho e envia quando houver ligação.
// Configuração: src/config.js (url e chave pública do projeto). Estrutura da base de dados: supabase/schema.sql.
const CC=window.APPGYM_CLOUD||{},CLOUD_ON=!!(CC.url&&CC.key&&window.supabase&&supabase.createClient);
let SB=null,CU=null,CT=null,CBUSY=0,AMSG='',RECOV=0,CBKS=null,ABUSY=0,ACONF=0;
let CMETA={};try{CMETA=JSON.parse(localStorage.getItem(K+'_meta'))||{}}catch(e){}
let SY=CLOUD_ON?'sn':'sl',SYT=CMETA.syncedAt?Date.parse(CMETA.syncedAt):0;
const cmSave=()=>{try{localStorage.setItem(K+'_meta',JSON.stringify(CMETA))}catch(e){}};
if(RECOVERED){CMETA.syncedAt=null;CMETA.dirty=0;cmSave()} // depois de recuperar, a versão da nuvem tem prioridade
function drawSY(){const e=$('#sy');if(e)e.textContent=x(SY)+(SY=='so'&&SYT?' · '+new Date(SYT).toLocaleTimeString(LC(),{hour:'2-digit',minute:'2-digit'}):'')}
const setSY=s=>{SY=s;drawSY()};
// dados vindos da nuvem: substituem os locais sem voltar a ser enviados
function adopt(d){NOQ=1;try{S=d;W=S.W||null;fix();writeLocal()}finally{NOQ=0}R();if(ST)drawST()}
// junta dois estados (b = o mais recente ganha quando há o mesmo registo nos dois)
function mergeS(a,b){const o={...a,...b},byId=(x,y,k)=>{const m=new Map();(x||[]).forEach(e=>m.set(e[k],e));(y||[]).forEach(e=>m.set(e[k],e));return[...m.values()]};
['habits','workouts','routines','tasks'].forEach(k=>o[k]=byId(a[k],b[k],'id'));['cfoods','custom'].forEach(k=>o[k]=byId(a[k],b[k],'n'));o.cmeals=byId(a.cmeals,b.cmeals,'id');o.meals=byId(a.meals,b.meals,'k');
['nlog','mood','wlog','barcodes','exRest','coach'].forEach(k=>o[k]={...(a[k]||{}),...(b[k]||{})});
o.habits.forEach(h=>{const ha=(a.habits||[]).find(y=>y.id===h.id);if(ha)h.done={...(ha.done||{}),...(h.done||{})}});
o.workouts.sort((p,q)=>p.id-q.id);o.W=b.W||a.W||null;o.set={...(a.set||{}),...(b.set||{})};o.since=[a.since,b.since].filter(Boolean).sort()[0];o._at=Math.max(a._at||0,b._at||0);return o}
const isEmpty=s=>!s.workouts.length&&!Object.keys(s.nlog||{}).length&&!(s.tasks||[]).length&&!Object.keys(s.mood||{}).length&&!s.habits.some(h=>Object.keys(h.done||{}).length);
// volta do link do email: mostra se confirmou ou se o link já não servia
function authUrl(){const h=new URLSearchParams((location.hash||'').slice(1)),q=new URLSearchParams(location.search);
if(h.get('error_code')||q.get('error_code')||h.get('error')||q.get('error')){AMSG=x('e_link');ACONF=1;try{history.replaceState(null,'',location.pathname)}catch(e){}setTimeout(openST,300)}
else if(h.get('type')=='signup'&&h.get('access_token')){AMSG=x('m_confok');setTimeout(openST,300)}}
async function cloudInit(){if(!CLOUD_ON){drawSY();return}authUrl();
SB=supabase.createClient(CC.url,CC.key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:K+'_auth'}});
SB.auth.onAuthStateChange((ev,ses)=>{CU=ses?ses.user:null;if(ev=='PASSWORD_RECOVERY'){RECOV=1;openST()}
if((ev=='INITIAL_SESSION'||ev=='SIGNED_IN')&&CU)setTimeout(cloudPull,0);if(ev=='INITIAL_SESSION'&&!CU)setSY('sn');if(ev=='SIGNED_OUT')setSY('sn');if(ST)drawST();R()});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState=='hidden')cloudPush();else if(CU)cloudPull()});
addEventListener('online',()=>{if(CU)cloudPull()});addEventListener('pagehide',()=>cloudPush())}
// chamado por save(): marca alterações e envia passado 1,5 s
function cloudQ(){CMETA.dirty=1;cmSave();if(!CU)return;clearTimeout(CT);setSY('pend');CT=setTimeout(cloudPush,1500)}
async function cloudPush(){if(!CU||!CMETA.dirty)return;if(CBUSY){clearTimeout(CT);CT=setTimeout(cloudPush,1500);return}CBUSY=1;clearTimeout(CT);setSY('sg');
try{const {data:row,error:e1}=await SB.from('app_data').select('updated_at').eq('user_id',CU.id).maybeSingle();if(e1)throw e1;
if(row&&CMETA.syncedAt&&row.updated_at!==CMETA.syncedAt&&Date.parse(row.updated_at)>Date.parse(CMETA.syncedAt)){CBUSY=0;return cloudPull()} // outro aparelho mudou entretanto
const at=new Date(Math.max(S._at||0,Date.now())).toISOString(),dev=(navigator.userAgent||'').slice(0,90);
const {data:up,error:e2}=await SB.from('app_data').upsert({user_id:CU.id,data:S,updated_at:at,device:dev}).select('updated_at').single();if(e2)throw e2;
await SB.from('app_backups').upsert({user_id:CU.id,day:day(),data:S});
CMETA={...CMETA,uid:CU.id,syncedAt:up.updated_at,dirty:0};cmSave();SYT=Date.now();setSY('so')}
catch(e){setSY(navigator.onLine===false?'off':'er')}finally{CBUSY=0}}
async function cloudPull(){if(!CU||CBUSY)return;CBUSY=1;setSY('sg');let push=0;
try{const {data:row,error}=await SB.from('app_data').select('data,updated_at').eq('user_id',CU.id).maybeSingle();if(error)throw error;
const other=CMETA.uid&&CMETA.uid!==CU.id;
if(!row){ // conta sem dados na nuvem
if(other||(!CMETA.uid&&!isEmpty(S))){if(other&&!confirm(x('useloc'))){LBK.snap('other');adopt(DEF())}}
CMETA.uid=CU.id;CMETA.dirty=1;cmSave();push=1}
else if(other){LBK.snap('other');adopt(row.data);CMETA={uid:CU.id,syncedAt:row.updated_at,dirty:0};cmSave()}
else if(row.updated_at===CMETA.syncedAt){push=!!CMETA.dirty;if(!push){SYT=Date.now();setSY('so')}}
else if(!CMETA.dirty||(!CMETA.uid&&isEmpty(S))){adopt(row.data);CMETA={uid:CU.id,syncedAt:row.updated_at,dirty:0};cmSave();SYT=Date.now();setSY('so')}
else{ // mudou no aparelho e na nuvem: junta tudo (o mais recente ganha nos registos repetidos), guarda cópia do que havia
LBK.snap('merge');const cloudNewer=Date.parse(row.updated_at)>(S._at||0);const m=cloudNewer?mergeS(S,row.data):mergeS(row.data,S);
adopt(m);CMETA={uid:CU.id,syncedAt:row.updated_at,dirty:1};cmSave();push=1}}
catch(e){setSY(navigator.onLine===false?'off':'er')}finally{CBUSY=0}if(push)await cloudPush();if(CU&&typeof coachSync=='function')coachSync()}
// ---- conta ----
const errMsg=e=>{const m=String(e&&e.message||e);return /invalid login/i.test(m)?x('e_cred'):/not confirmed/i.test(m)?(ACONF=1,x('e_conf')):/rate limit|security purposes|only request/i.test(m)||e&&e.status==429?x('e_rate'):x('e_gen')+m};
// impede toques repetidos enquanto espera pelo servidor (cada email novo anula o link do anterior)
const abusy=async f=>{if(ABUSY)return;ABUSY=1;drawST();try{await f()}catch(e){AMSG=errMsg(e)}finally{ABUSY=0;drawST()}};
const aval=()=>({em:($('#aem')||{}).value||'',pw:($('#apw')||{}).value||''});
const accIn=()=>abusy(async()=>{const {em,pw}=aval();AMSG='';const {error}=await SB.auth.signInWithPassword({email:em.trim(),password:pw});if(error)AMSG=errMsg(error)});
const accUp=()=>abusy(async()=>{const {em,pw}=aval();AMSG='';const {data,error}=await SB.auth.signUp({email:em.trim(),password:pw,options:{emailRedirectTo:location.origin+location.pathname}});AMSG=error?errMsg(error):data.session?'':x('m_conf');if(!error&&!data.session)ACONF=1});
const accResend=()=>abusy(async()=>{const {em}=aval();if(!em.trim()){AMSG=x('eml')+'?';return}const {error}=await SB.auth.resend({type:'signup',email:em.trim(),options:{emailRedirectTo:location.origin+location.pathname}});AMSG=error?errMsg(error):x('m_sent')});
const accReset=()=>abusy(async()=>{const {em}=aval();if(!em.trim()){AMSG=x('eml')+'?';return}const {error}=await SB.auth.resetPasswordForEmail(em.trim(),{redirectTo:location.origin+location.pathname});AMSG=error?errMsg(error):x('m_reset')});
async function accNewPw(){const pw=($('#anp')||{}).value||'';const {error}=await SB.auth.updateUser({password:pw});AMSG=error?errMsg(error):x('pwok');if(!error)RECOV=0;drawST()}
async function accOut(){await cloudPush();await SB.auth.signOut();CBKS=null;if(typeof PR!='undefined'){PR=null;CO=null;ADL=null}drawST()}
async function cbkList(){const {data,error}=await SB.from('app_backups').select('day,created_at').eq('user_id',CU.id).order('day',{ascending:false}).limit(30);CBKS=error?[]:data;drawST()}
async function cbkRestore(d){if(!confirm(x('rstq').replace('{d}',d)))return;const {data,error}=await SB.from('app_backups').select('data').eq('user_id',CU.id).eq('day',d).single();if(error||!validS(data.data))return alert(x('bkn'));LBK.snap('restore');adopt(data.data);save()}
function lbkRestore(k){const j=LBK.get(k);if(!j||!confirm(x('rstq').replace('{d}',k.slice(LBK_P.length,LBK_P.length+10))))return;LBK.snap('restore');adopt(j);save()}
function cloudCard(){const lb=LBK.keys().slice(0,7),lbH=lb.length?`<details class="dt"><summary>📱 ${x('lbk')} (${lb.length})</summary>${lb.map(k=>`<div class="row"><span class="grow">${k.slice(LBK_P.length,LBK_P.length+10)}${k.length>LBK_P.length+10?' · '+k.slice(LBK_P.length+11).split('_')[0]:''}</span><button class="btn alt sm" onclick="lbkRestore('${k}')">${x('rsto')}</button></div>`).join('')}</details>`:'';
const msg=AMSG?`<div class="mut" style="margin-top:8px;color:var(--tx)">${esc(AMSG)}</div>`:'';
if(!CLOUD_ON)return `<div class="card"><h2>☁️ ${x('acc')}</h2><div class="mut">${x('accoff')}</div>${lbH}</div>`;
if(RECOV)return `<div class="card"><h2>🔑 ${x('newpw')}</h2><input id="anp" type="password" autocomplete="new-password" style="text-align:left"><button class="btn full" onclick="accNewPw()">${x('sv')}</button>${msg}</div>`;
if(!CU)return `<div class="card"><h2>☁️ ${x('acc')}</h2><div class="mut" style="margin-bottom:8px">${x('acch')}</div><input id="aem" type="email" autocomplete="email" inputmode="email" placeholder="${x('eml')}" style="text-align:left"><input id="apw" type="password" autocomplete="current-password" placeholder="${x('pwd')}" style="text-align:left;margin-top:8px">
<button class="btn full" ${ABUSY?'disabled':''} onclick="accIn()">${x('login')}</button><button class="btn alt full" ${ABUSY?'disabled':''} onclick="accUp()">${x('signup')}</button>${ACONF?`<button class="btn alt full" ${ABUSY?'disabled':''} onclick="accResend()">✉️ ${x('resend')}</button>`:''}<button class="lnk" style="margin-top:10px;color:var(--mut);font-size:14px" ${ABUSY?'disabled':''} onclick="accReset()">${x('forgot')}</button>${msg}${lbH}</div>`;
return `<div class="card"><h2>☁️ ${x('acc')}</h2><div>${x('accin')}: <b>${esc(CU.email||'')}</b></div><div class="mut" id="sy" style="margin-top:6px"></div><button class="btn full" onclick="CMETA.dirty=1;cloudPull()">🔄 ${x('syncnow')}</button>
<details class="dt" ${CBKS?'open':''} ontoggle="if(this.open&&!CBKS)cbkList()"><summary>☁️ ${x('cbk')}</summary>${CBKS?CBKS.map(b=>`<div class="row"><span class="grow">${b.day}</span><button class="btn alt sm" onclick="cbkRestore('${b.day}')">${x('rsto')}</button></div>`).join('')||'<div class="mut">–</div>':`<div class="mut">${x('sg')}</div>`}</details>${lbH}
<button class="btn red full" onclick="accOut()">${x('logout')}</button>${msg}</div>`}
