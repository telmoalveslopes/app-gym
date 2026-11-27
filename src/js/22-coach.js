// ===== Personal trainer (PT) e alunos =====
// Segurança (garantida no servidor, supabase/schema.sql):
//  - só o admin dá o estatuto de PT; ninguém se promove a si próprio;
//  - é o ALUNO que se liga ao PT com o código dele, e qualquer um dos dois pode terminar a ligação;
//  - o PT só LÊ os dados do aluno; o plano vai numa tabela à parte (coach_plans);
//  - aqui, a app do aluno só ACRESCENTA a partir do plano (rotinas, hábitos, alimentos, pesagens em dias sem registo)
//    e nunca apaga histórico. S.coach = {coach_id: {name, at, plan}} guarda a última versão do plano recebido.
const MEALS0=['b','l','s','d'];
let PR=null,CO=null,COS=null,CEP=null,COMSG='',ADL=null; // PR perfil; CO alunos; COS aluno aberto; CEP plano em edição
const isCo=()=>!!PR&&(PR.role=='coach'||PR.role=='admin'),isAd=()=>!!PR&&PR.role=='admin';
const cErr=e=>{const m=String(e&&e.message||e);return /invalid code/.test(m)?x('co_badc'):/own code/.test(m)?x('co_own'):/not allowed|security/.test(m)?x('co_na'):/no user/.test(m)?x('co_nou'):/is admin/.test(m)?x('co_isad'):x('e_gen')+m};
const withS=(d,f)=>{const o=S;S=d;try{return f()}finally{S=o}};
const mlab=k=>D['m_'+k]?x('m_'+k):k;

// --- metas do PT (têm prioridade sobre o cálculo automático) ---
const coachP=()=>Object.values(S.coach||{}).filter(z=>z.plan&&z.plan.goals&&+z.plan.goals.gk>0).sort((a,b)=>String(b.at).localeCompare(String(a.at)))[0];
const coachG=()=>{const c=coachP();return c?c.plan.goals:null};

// --- aluno: receber planos ---
async function coachSync(){if(!CU||!SB)return;try{
const {data:p}=await SB.rpc('ensure_profile',{p_name:S.set.name||null});if(p)PR=Array.isArray(p)?p[0]:p;
const {data:cs,error:e1}=await SB.rpc('my_coaches');if(e1)throw e1;const {data:pl,error:e2}=await SB.from('coach_plans').select('coach_id,plan,updated_at').eq('student_id',CU.id);if(e2)throw e2;
applyPlans(cs||[],pl||[])}catch(e){}if(ST)drawST()}
function applyPlans(cs,pl){let ch=0;const act=new Set(cs.map(c=>c.coach_id));
Object.keys(S.coach).forEach(id=>{if(!act.has(id)){untag(id);delete S.coach[id];ch=1}}); // ligação terminada: o que já foi acrescentado fica
cs.forEach(c=>{const p=pl.find(z=>z.coach_id===c.coach_id),cur=S.coach[c.coach_id],at=p?p.updated_at:null,nm=c.name||'';
if(!cur||cur.at!==at||cur.name!==nm){const plan=p&&p.plan&&typeof p.plan=='object'?p.plan:{};S.coach[c.coach_id]={name:nm,at,plan};mergePlan(c.coach_id,plan);ch=1}});
if(ch){save();R()}}
const nid=()=>Date.now()+Math.floor(Math.random()*1e4);
function mergePlan(cid,p){const tag=r=>cid+':'+r,mine=z=>z&&typeof z==='string'&&z.startsWith(cid+':');
(p.custom||[]).forEach(c=>{if(c&&c.n&&!EXM.has(c.n)&&!S.custom.some(z=>z.n===c.n))S.custom.push({n:String(c.n),g:c.g||'Cardio e corpo inteiro',t:FT[c.t]?c.t:'wr'})});
const rs=Array.isArray(p.routines)?p.routines:[];
S.routines.forEach(r=>{if(mine(r.cr)&&!rs.some(z=>tag(z.id)==r.cr)){r.crx=r.cr;delete r.cr}}); // o PT tirou: fica como rotina normal
rs.forEach(z=>{const ex=(z.ex||[]).filter(e=>Array.isArray(e)&&e[0]).map(e=>[String(e[0]),Math.max(1,Math.min(20,+e[1]||1)),+e[2]||0,e[3]?1:0]),r=S.routines.find(y=>y.cr==tag(z.id)||y.crx==tag(z.id));
if(r){r.name=String(z.name||r.name);r.ex=ex;r.cr=tag(z.id);delete r.crx}else S.routines.push({id:nid(),name:String(z.name||'PT'),ex,cr:tag(z.id)})});
const hs=Array.isArray(p.habits)?p.habits:[];
S.habits.forEach(h=>{if(mine(h.ch)&&!hs.some(z=>tag(z.id)==h.ch)){h.chx=h.ch;delete h.ch}});
hs.forEach(z=>{const o={name:String(z.name||'').slice(0,60)||'✅',emoji:String(z.emoji||'✅').slice(0,8),f:z.f=='w'?'w':'d',days:Array.isArray(z.days)?z.days.filter(i=>i>=0&&i<7):[],t:z.f=='w'?Math.max(1,Math.min(7,+z.t||1)):0},h=S.habits.find(y=>y.ch==tag(z.id)||y.chx==tag(z.id));
if(h){Object.assign(h,o);h.ch=tag(z.id);delete h.chx}else S.habits.push({id:nid(),done:{},aw:0,ch:tag(z.id),...o})}); // o histórico (done) nunca se mexe
(p.foods||[]).forEach(f=>{if(f&&f.n&&Array.isArray(f.v)&&!fInfo(f.n))S.cfoods.push({n:String(f.n),c:'★',u:+f.u||100,v:f.v.map(v=>+v||0),src:'PT'})});
Object.entries(p.wlog||{}).forEach(([d,v])=>{if(/^\d{4}-\d\d-\d\d$/.test(d)&&+v>20&&+v<400&&S.wlog[d]==null)S.wlog[d]=+v})} // pesagens do PT só em dias sem registo
// ao terminar a ligação as rotinas e hábitos ficam como normais; crx/chx lembram a origem para não duplicar se voltar a ligar
function untag(cid){const mine=z=>z&&typeof z==='string'&&z.startsWith(cid+':');S.routines.forEach(r=>{if(mine(r.cr)){r.crx=r.cr;delete r.cr}});S.habits.forEach(h=>{if(mine(h.ch)){h.chx=h.ch;delete h.ch}})}
async function coJoin(){const c=(($('#cocode')||{}).value||'').trim();if(!c)return;if(!confirm(x('co_jq')))return;const {data,error}=await SB.rpc('join_coach',{p_code:c});COMSG=error?cErr(error):x('co_ok').replace('{n}',data&&data.name||x('co_pt'));await coachSync();drawST()}
async function coLeave(id){const c=S.coach[id];if(!confirm(x('co_lq').replace('{n}',c&&c.name||x('co_pt'))))return;const {error}=await SB.from('coach_links').delete().eq('coach_id',id).eq('student_id',CU.id);COMSG=error?cErr(error):x('co_left');await coachSync();drawST()}
function coachCard(){if(!CLOUD_ON||!CU)return'';const cs=Object.entries(S.coach||{});
return `<div class="card"><h2>🧑‍🏫 ${x('co_pt')}</h2>${cs.map(([id,c])=>`<div class="row"><div class="grow"><b>${esc(c.name||x('co_pt'))}</b><div class="mut">${x('co_sees')}</div></div><button class="btn red sm" onclick="coLeave('${esc(id)}')">${x('co_end')}</button></div>`).join('')}
<div class="mut" style="margin:8px 0">${x('co_jh')}</div><div style="display:flex;gap:8px"><input id="cocode" placeholder="${x('co_code')}" autocapitalize="characters" autocomplete="off" style="text-transform:uppercase"><button class="btn" onclick="coJoin()">${x('co_join')}</button></div>
${isCo()?`<div class="row" style="margin-top:12px"><div class="grow"><b>${x('co_mine')}</b><div class="mut">${x('co_share')}: <b style="font-size:17px;letter-spacing:.1em;color:var(--tx)">${esc(PR.coach_code||'…')}</b></div></div><button class="btn ar" onclick="openCO()">👥 ${x('co_open')}</button></div>`:''}
${COMSG?`<div class="mut" style="margin-top:8px;color:var(--tx)">${esc(COMSG)}</div>`:''}</div>`}
function coachToday(){return Object.values(S.coach||{}).filter(c=>c.plan&&String(c.plan.note||'').trim()).map(c=>`<div class="card" style="border-left:4px solid var(--c-pf)"><h2>🧑‍🏫 ${esc(c.name||x('co_pt'))}</h2><div style="white-space:pre-wrap">${esc(c.plan.note)}</div></div>`).join('')}
const coMeals=()=>Object.values(S.coach||{}).flatMap(c=>Array.isArray(c.plan&&c.plan.meals)?c.plan.meals.filter(m=>m&&Array.isArray(m.items)):[]);
function coachMeals(){const ms=coMeals();if(!ms.length)return'';return `<div class="card" style="border-left:4px solid var(--c-pf)"><h2>🧑‍🏫 ${x('co_mp')}</h2>${ms.map((m,i)=>`<div class="row"><div class="grow"><b>${esc(mname(m.m))}</b> · ${esc(m.n||'')}<div class="mut">${m.items.map(e=>esc(xn(e.n))+' '+e.g+' g').join(' · ')} · ${Math.round(fkc(m.items))} kcal</div></div><button class="qadd" onclick="coMLog(${i})">＋</button></div>`).join('')}</div>`}
function coMLog(i){const m=coMeals()[i];if(!m)return;const d=ND,a=S.nlog[d]=S.nlog[d]||{},k=String(m.m||'s');a[k]=(a[k]||[]).concat(m.items.map(e=>({n:String(e.n),g:+e.g||0})));saveN(d);R()}

// --- PT: painel dos alunos ---
async function openCO(){COS=null;CEP=null;COMSG='';drawCO();await coLoad()}
function closeCO(){$('#co').style.display='none';COS=null;CEP=null;R()}
async function coLoad(){CO={st:CO?CO.st:[],load:1,tab:CO&&CO.tab};drawCO();try{const {data:st,error}=await SB.rpc('my_students');if(error)throw error;const ids=(st||[]).map(s=>s.student_id);
const [a,b]=await Promise.all([ids.length?SB.from('app_data').select('user_id,data,updated_at').in('user_id',ids):Promise.resolve({data:[]}),SB.from('coach_plans').select('student_id,plan,updated_at').eq('coach_id',CU.id)]);if(a.error)throw a.error;if(b.error)throw b.error;
CO={tab:CO.tab,st:(st||[]).map(s=>{const r=(a.data||[]).find(z=>z.user_id===s.student_id),p=(b.data||[]).find(z=>z.student_id===s.student_id);return{...s,data:r&&validS(r.data)?fixData(JSON.parse(JSON.stringify(r.data))):null,at:r&&r.updated_at,plan:p&&p.plan||{}}})}}
catch(e){CO={st:[],err:cErr(e)}}if(isAd())try{const {data}=await SB.rpc('admin_list');ADL=data||[]}catch(e){}drawCO()}
function stStats(d){return withS(d,()=>{const ds=[6,5,4,3,2,1,0].map(back),G=goal(),kc=ds.map(z=>Math.round(tot(z)[0])),pr=ds.map(z=>Math.round(tot(z)[1])),lg=kc.filter(v=>v>0),pl=pr.filter((v,i)=>kc[i]>0),wl=Object.keys(S.wlog).sort();
return{ds,G,kc,kav:lg.length?Math.round(lg.reduce((a,b)=>a+b,0)/lg.length):0,pav:pl.length?Math.round(pl.reduce((a,b)=>a+b,0)/pl.length):0,kok:kc.filter(v=>v>0&&Math.abs(v-G[0])<=G[0]*.1).length,logd:lg.length,
wo:S.workouts.filter(w=>ds.includes(w.date)).map(w=>({...w,vl:vol(w)})),hp:habPct(ds),lw:wl.length?S.wlog[wl[wl.length-1]]:null,lwd:wl[wl.length-1],first:wl.length?S.wlog[wl[0]]:null,habits:S.habits.map(h=>({h,d:ds.map(z=>hdone(h,z))}))}})}
function drawCO(){const p=$('#co');p.style.display='block';const st=CO&&CO.st||[],cur=COS!=null&&st[COS];let b;
if(cur)b=coStudent(cur);
else b=`<div class="card"><h2>🔑 ${x('co_share')}</h2><div style="font-size:30px;font-weight:800;letter-spacing:.15em;text-align:center;margin:6px 0">${esc(PR&&PR.coach_code||'…')}</div><div class="mut">${x('co_shh')}</div></div>`
+(CO&&CO.load?`<div class="mut">${x('sg')}</div>`:CO&&CO.err?`<div class="card mut">${esc(CO.err)}</div>`:'')
+`<div class="sh"><span>${x('co_sts')}<span class="cnt">${st.length}</span></span><button class="lnk" onclick="coLoad()">🔄</button></div>`
+(st.map((s,i)=>{const k=s.data?stStats(s.data):null;return `<div class="card" style="cursor:pointer" onclick="COS=${i};CEP=null;COMSG='';drawCO()"><div style="display:flex;align-items:center;gap:10px"><div class="av" style="background:var(--c-pf);width:42px;height:42px;font-size:18px">${esc((s.name||s.email||'?')[0].toUpperCase())}</div><div class="grow"><b>${esc(s.name||s.email||'')}</b><div class="mut">${s.at?x('co_last')+' '+fd(day(new Date(s.at))):x('co_nod')}</div></div><span class="mut" style="font-size:22px">›</span></div>
${k?`<div class="kpi3" style="margin-top:10px"><div><span class="mut">${x('wo')} 7d</span><b>${k.wo.length}</b></div><div><span class="mut">kcal Ø</span><b>${k.kav}<span class="mut" style="font-size:12px">/${k.G[0]}</span></b></div><div><span class="mut">${x('hb')}</span><b>${k.hp}%</b></div></div>`:''}</div>`}).join('')||`<div class="card empty">${x('co_none')}</div>`)+(isAd()?adCard():'');
p.innerHTML=`<div class="w" style="padding-bottom:40px"><div style="display:flex;align-items:center;gap:6px">${cur?`<button class="btn alt sm" onclick="COS=null;CEP=null;COMSG='';drawCO()">←</button>`:''}<h1 style="flex:1;font-size:26px">${cur?esc(cur.name||cur.email||''):x('co_panel')}</h1><button class="btn red" onclick="closeCO()">✕</button></div>${b}</div>`}
function coStudent(s){const k=s.data?stStats(s.data):null,tab=CO.tab||'st';CEP=CEP||JSON.parse(JSON.stringify(s.plan||{}));const P=CEP;P.goals=P.goals||{};['routines','habits','meals'].forEach(q=>{if(!Array.isArray(P[q]))P[q]=[]});P.wlog=P.wlog||{};
const seg=`<div class="mut">${esc(s.email||'')}</div><div class="seg tabs">${[['st',x('co_prog')],['pl',x('co_plan')]].map(([q,l])=>`<button class="${tab==q?'on':''}" onclick="CO.tab='${q}';drawCO()">${l}</button>`).join('')}</div>`;
if(tab=='pl')return seg+planEditor(P);
if(!k)return seg+`<div class="card mut">${x('co_nod')}</div><button class="btn red full" onclick="coRemove('${esc(s.student_id)}')">${x('co_rm')}</button>`;
const mx=Math.max(k.G[0],...k.kc,1),dw=k.lw&&k.first&&k.first!=k.lw?k.lw-k.first:0;
return seg+`<div class="kpi"><div><b>${k.wo.length}</b><span class="mut">${x('wo')} 7d</span></div><div><b>${k.hp}%</b><span class="mut">${x('hb')}</span></div><div><b>${k.lw?uIn('w',k.lw):'–'}</b><span class="mut">${U.w()}${dw?' ('+(dw>0?'+':'')+uIn('w',dw)+')':''}</span></div></div>
<div class="card"><div style="display:flex;align-items:baseline;gap:6px"><h2 style="flex:1;margin:0">${x('co_kc')}</h2><span class="mut">${k.kok}/7 ${x('co_ontg')}</span></div><div style="position:relative;margin-top:10px"><div style="position:absolute;left:0;right:0;bottom:${Math.round(k.G[0]/mx*80)+16}px;border-top:1px dashed var(--mut);opacity:.6"></div><div class="bars">${k.ds.map((z,i)=>`<div><b style="height:${Math.round(k.kc[i]/mx*80)}px;${k.kc[i]>k.G[0]*1.1?'background:#e5534b':k.kc[i]>=k.G[0]*.9?'background:#2dc58a':''}"></b>${DN()[dow(z)][0]}</div>`).join('')}</div></div>
<div class="mut" style="margin-top:6px">Ø ${k.kav} / ${k.G[0]} kcal · ${L=='en'?'Protein':'Proteína'} Ø ${k.pav} / ${k.G[1]} g · ${k.logd}/7 ${x('co_logd')}</div></div>
<div class="card"><h2>${x('habitos')} · 7d</h2>${k.habits.map(({h,d})=>`<div style="display:flex;align-items:center;gap:6px;margin:8px 0"><span class="grow">${esc(h.emoji)} ${esc(h.name)}</span>${d.map(v=>`<i class="hdot ${v?'on':''}"></i>`).join('')}</div>`).join('')||'<div class="mut">–</div>'}</div>
<div class="card"><h2>${x('treino')} · 7d</h2>${k.wo.map(w=>`<div class="row"><div class="grow"><b>${esc(w.name)}</b><div class="mut">${fd(w.date)} · ${w.dur} min · ${w.ex.length} ${x('exs')}</div></div><span class="mut">${fvol(w.vl)}</span></div>`).join('')||`<div class="mut">${x('nhs')}</div>`}</div>
<button class="btn red full" onclick="coRemove('${esc(s.student_id)}')">${x('co_rm')}</button>`}
const fkcF=l=>l.reduce((a,e)=>{const f=fInfo(e.n);return a+(f?f.v[0]*e.g/100:0)},0);
function planEditor(P){const g=P.goals,ta='width:100%;font:inherit;font-size:16px;color:var(--tx);background:var(--bg);border:1px solid var(--bd);border-radius:12px;padding:10px';
return `<div class="card"><h2>🎯 ${x('obj')}</h2>${[['gk','kcal'],['gp',(L=='en'?'Protein':'Proteína')+' (g)'],['gc',(L=='en'?'Carbs':'Hidratos')+' (g)'],['gf',(L=='en'?'Fat':'Gordura')+' (g)'],['gfi',(L=='en'?'Fiber':'Fibra')+' (g)']].map(([q,l])=>`<div class="row"><span class="grow">${l}</span><input type="number" inputmode="decimal" style="width:110px" value="${g[q]??''}" oninput="CEP.goals.${q}=this.value"></div>`).join('')}
<div class="row"><span class="grow">${x('co_tw')} (${U.w()})</span><input type="number" inputmode="decimal" style="width:110px" value="${g.tw?uIn('w',g.tw):''}" oninput="CEP.goals.tw=uOut('w',this.value)"></div><div class="mut" style="margin-top:6px">${x('co_gh')}</div></div>
<div class="card"><h2>⚖️ ${x('co_wi')}</h2>${Object.keys(P.wlog).sort().reverse().map(d=>`<div class="row"><span class="grow">${fd(d)}/${d.slice(0,4)}</span><b>${fu('w',P.wlog[d])}</b><button class="btn red" onclick="delete CEP.wlog['${d}'];drawCO()">✕</button></div>`).join('')}<div style="display:flex;gap:8px;margin-top:8px"><input id="cowd" type="date" value="${day()}"><input id="cowv" type="number" inputmode="decimal" placeholder="${U.w()}" style="width:90px"><button class="btn" onclick="coWAdd()">＋</button></div><div class="mut" style="margin-top:6px">${x('co_wih')}</div></div>
<div class="card"><h2>🏋️ ${x('rt')}</h2>${P.routines.map((r,i)=>`<div class="row"><div class="grow"><b>${esc(r.name)}</b><div class="mut clamp" style="margin:2px 0 0">${(r.ex||[]).map(e=>esc(xn(e[0]))+' ×'+e[1]).join(' · ')}</div></div><button class="btn red" onclick="CEP.routines.splice(${i},1);drawCO()">✕</button></div>`).join('')||`<div class="mut">${x('co_nrt')}</div>`}
${S.routines.length?`<select id="cort" style="margin-top:8px">${S.routines.map(r=>`<option value="${r.id}">${esc(r.name)}</option>`).join('')}</select><button class="btn alt full" onclick="coRAdd()">＋ ${x('co_art')}</button>`:''}<div class="mut" style="margin-top:6px">${x('co_rth')}</div></div>
<div class="card"><h2>✅ ${x('habitos')}</h2>${P.habits.map((h,i)=>`<div class="row"><span class="grow">${esc(h.emoji||'✅')} ${esc(h.name)}<div class="mut">${h.f=='w'?x('wkly')+' · '+h.t+'×':x('dly')}</div></span><button class="btn red" onclick="CEP.habits.splice(${i},1);drawCO()">✕</button></div>`).join('')}
<div style="display:flex;gap:8px;margin-top:8px"><input id="cohe" placeholder="😀" style="width:56px;text-align:center"><input id="cohn" placeholder="${x('hph')}"></div><div style="display:flex;gap:8px;margin-top:8px"><select id="cohf"><option value="d">${x('dly')}</option>${[1,2,3,4,5,6].map(n=>`<option value="${n}">${x('wkly')} · ${n}×</option>`).join('')}</select><button class="btn" onclick="coHAdd()">＋</button></div></div>
<div class="card"><h2>🍽️ ${x('co_mp')}</h2>${P.meals.map((m,i)=>`<div class="row"><div class="grow"><b>${esc(mlab(m.m))}</b> · ${esc(m.n)}<div class="mut">${m.items.map(e=>esc(xn(e.n))+' '+e.g+' g').join(' · ')} · ${Math.round(fkcF(m.items))} kcal</div></div><button class="btn red" onclick="CEP.meals.splice(${i},1);drawCO()">✕</button></div>`).join('')||`<div class="mut">${x('co_nmp')}</div>`}
${S.cmeals.length?`<div style="display:flex;gap:8px;margin-top:8px"><select id="comm">${MEALS0.map(k=>`<option value="${k}">${x('m_'+k)}</option>`).join('')}</select><select id="comc">${S.cmeals.map(c=>`<option value="${c.id}">${esc(c.n)}</option>`).join('')}</select></div><button class="btn alt full" onclick="coMAdd()">＋ ${x('co_amp')}</button>`:''}<div class="mut" style="margin-top:6px">${x('co_mph')}</div></div>
<div class="card"><h2>📝 ${x('co_note')}</h2><textarea rows="4" style="${ta}" oninput="CEP.note=this.value">${esc(P.note||'')}</textarea></div>
<button class="btn ar big full" onclick="coSave()">💾 ${x('co_send')}</button>${COMSG?`<div class="mut" style="margin-top:8px;color:var(--tx)">${esc(COMSG)}</div>`:''}`}
function coWAdd(){const d=$('#cowd').value,v=+uOut('w',$('#cowv').value);if(!/^\d{4}-\d\d-\d\d$/.test(d)||!(v>20&&v<400))return;CEP.wlog[d]=v;drawCO()}
function coRAdd(){const r=S.routines.find(y=>y.id==$('#cort').value);if(!r)return;CEP.routines.push({id:String(r.id)+'_'+Date.now().toString(36),name:r.name,ex:r.ex.map(e=>e.slice())});drawCO()}
function coHAdd(){const n=$('#cohn').value.trim();if(!n)return;const f=$('#cohf').value;CEP.habits.push({id:Date.now().toString(36),name:n.slice(0,60),emoji:$('#cohe').value.trim()||'✅',f:f=='d'?'d':'w',t:f=='d'?0:+f,days:[]});drawCO()}
function coMAdd(){const c=S.cmeals.find(y=>y.id==$('#comc').value);if(!c)return;CEP.meals.push({id:Date.now().toString(36),m:$('#comm').value,n:c.n,items:c.items.map(e=>({n:e.n,g:e.g}))});drawCO()}
const coFoods=P=>{const o=[];P.meals.forEach(m=>m.items.forEach(e=>{const f=S.cfoods.find(z=>z.n===e.n);if(f&&!o.some(z=>z.n===f.n))o.push({n:f.n,u:f.u,v:f.v})}));return o};
const coCustom=P=>{const o=[];P.routines.forEach(r=>(r.ex||[]).forEach(e=>{const c=S.custom.find(z=>z.n===e[0]);if(c&&!o.some(z=>z.n===c.n))o.push({n:c.n,g:c.g,t:c.t})}));return o};
async function coSave(){const s=CO.st[COS],P=CEP;['gk','gp','gc','gf','gfi','tw'].forEach(k=>{const v=P.goals[k];if(v===''||v==null||isNaN(+v)||+v<=0)delete P.goals[k];else P.goals[k]=+v});P.foods=coFoods(P);P.custom=coCustom(P);P.v=1;
const {error}=await SB.from('coach_plans').upsert({coach_id:CU.id,student_id:s.student_id,plan:P,updated_at:new Date().toISOString()});COMSG=error?cErr(error):x('co_sent');if(!error)s.plan=JSON.parse(JSON.stringify(P));drawCO()}
async function coRemove(sid){const s=CO.st.find(z=>z.student_id===sid);if(!s||!confirm(x('co_rmq').replace('{n}',s.name||s.email||'')))return;const {error}=await SB.from('coach_links').delete().eq('coach_id',CU.id).eq('student_id',sid);if(error)return alert(cErr(error));COS=null;CEP=null;coLoad()}
// --- admin: dar/tirar o estatuto de PT ---
function adCard(){return `<div class="card"><h2>🛡️ ${x('ad_t')}</h2><div class="mut" style="margin-bottom:8px">${x('ad_h')}</div><input id="ademl" type="email" autocomplete="off" placeholder="${x('eml')}"><div style="display:flex;gap:8px;margin-top:8px"><button class="btn ar" style="flex:1" onclick="adSet('coach')">${x('ad_mk')}</button><button class="btn red" style="flex:1" onclick="adSet('user')">${x('ad_rm')}</button></div>${(ADL||[]).map(a=>`<div class="row"><div class="grow">${esc(a.email||'')}<div class="mut">${a.role=='admin'?'Admin':x('co_pt')}${a.name?' · '+esc(a.name):''}</div></div><span class="mut">${a.students} ${x('co_stc')}</span></div>`).join('')}</div>`}
async function adSet(role){const e=(($('#ademl')||{}).value||'').trim();if(!e)return;if(!confirm(x(role=='coach'?'ad_mkq':'ad_rmq').replace('{e}',e)))return;const {error}=await SB.rpc('admin_set_role',{p_email:e,p_role:role});alert(error?cErr(error):x('ad_ok'));coLoad()}

Object.assign(D,{co_pt:['Personal trainer','Personal trainer'],co_sees:['Vê os teus treinos, nutrição, hábitos e peso. Não pode alterar nem apagar nada teu.','Sees your workouts, nutrition, habits and weight. Cannot change or delete anything of yours.'],
co_end:['Terminar','End'],co_jh:['Tens um PT? Pede-lhe o código e escreve-o aqui. Ele passa a ver os teus dados e a enviar-te planos (metas, rotinas, hábitos, refeições).','Have a PT? Ask for their code and enter it here. They will see your data and send you plans (goals, routines, habits, meals).'],
co_code:['Código do PT','PT code'],co_join:['Ligar','Connect'],co_jq:['O PT vai poder VER todos os teus dados (treinos, nutrição, hábitos, peso) e enviar-te planos. Não pode alterar nem apagar nada. Podes terminar quando quiseres. Continuar?','The PT will be able to SEE all your data (workouts, nutrition, habits, weight) and send you plans. They cannot change or delete anything. You can end it any time. Continue?'],
co_ok:['Ligado a {n}.','Connected to {n}.'],co_lq:['Terminar a ligação a {n}? Deixa de ver os teus dados. As rotinas e hábitos que te enviou ficam contigo.','End the connection with {n}? They will no longer see your data. Routines and habits they sent stay with you.'],co_left:['Ligação terminada.','Connection ended.'],
co_badc:['Código inválido.','Invalid code.'],co_own:['Esse é o teu próprio código.','That is your own code.'],co_na:['Sem permissão.','Not allowed.'],co_nou:['Não existe nenhuma conta com esse email.','No account with that email.'],co_isad:['Essa conta é admin.','That account is an admin.'],
co_mine:['Os meus alunos','My clients'],co_share:['O teu código de PT','Your PT code'],co_open:['Abrir','Open'],co_panel:['Os meus alunos','My clients'],co_shh:['Dá este código ao aluno. Ele escreve-o em Definições → Personal trainer → Ligar.','Give this code to your client. They enter it in Settings → Personal trainer → Connect.'],
co_sts:['Alunos','Clients'],co_none:['Ainda sem alunos. Partilha o teu código.','No clients yet. Share your code.'],co_last:['Atualizado','Updated'],co_nod:['Ainda sem dados na nuvem.','No cloud data yet.'],
co_prog:['Progresso','Progress'],co_plan:['Plano','Plan'],co_kc:['Calorias · 7 dias','Calories · 7 days'],co_ontg:['dias na meta','days on target'],co_logd:['dias registados','days logged'],co_rm:['Remover aluno','Remove client'],co_rmq:['Remover {n}? Deixas de ver os dados dele.','Remove {n}? You will no longer see their data.'],
co_tw:['Peso objetivo','Target weight'],co_gh:['Vazio = o aluno usa o cálculo automático. Com kcal preenchidas, estas metas aparecem na app do aluno.','Empty = client uses the automatic calculation. With kcal filled in, these goals show in the client app.'],
co_wi:['Pesagens','Weigh-ins'],co_wih:['Só entram nos dias em que o aluno não registou peso.','Only added on days the client has no weight logged.'],co_nrt:['Sem rotinas no plano.','No routines in the plan.'],co_art:['Enviar esta rotina','Send this routine'],co_rth:['Escolhe das tuas rotinas (Treino → Minhas rotinas).','Pick from your routines (Workout → My routines).'],
co_mp:['Plano alimentar','Meal plan'],co_nmp:['Sem refeições no plano.','No meals in the plan.'],co_amp:['Juntar ao plano','Add to plan'],co_mph:['Escolhe das tuas refeições guardadas (Nutrição → ＋ → Refeições).','Pick from your saved meals (Nutrition → ＋ → Meals).'],
co_note:['Nota para o aluno','Note for the client'],co_send:['Guardar e enviar plano','Save and send plan'],co_sent:['Plano enviado. Aparece na app do aluno na próxima sincronização.','Plan sent. It shows in the client app on next sync.'],co_stc:['alunos','clients'],co_gset:['Metas definidas pelo teu PT','Goals set by your PT'],
ad_t:['Admin · personal trainers','Admin · personal trainers'],ad_h:['Só tu (admin) podes dar ou tirar o estatuto de PT. A pessoa tem de ter conta criada na app.','Only you (admin) can grant or remove PT status. The person must have an account.'],ad_mk:['Tornar PT','Make PT'],ad_rm:['Tirar PT','Remove PT'],
ad_mkq:['Dar o estatuto de personal trainer a {e}?','Grant personal trainer status to {e}?'],ad_rmq:['Tirar o estatuto de personal trainer a {e}? Deixa de ver os alunos.','Remove personal trainer status from {e}? They will stop seeing their clients.'],ad_ok:['Feito.','Done.']});
