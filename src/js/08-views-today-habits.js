const mm=['😞','😕','😐','🙂','😄'];
function sched(h){return h.f!=='w'?x('dly'):h.days&&h.days.length?x('wkly')+' · '+h.days.map(i=>DN()[i]).join(', '):`${x('wkly')} · ${h.t}×`}
// hábitos que contam num dia (o mesmo critério do ecrã Hoje)
const habsOn=d=>{const T=day();return S.habits.filter(h=>d<=T?due(h,d):(h.f!=='w'||(h.days&&h.days.includes(dow(d)))))};
// % de hábitos cumpridos numa lista de dias (já passados)
function habPct(days){let dn=0,ex=0;S.habits.forEach(h=>{dn+=days.filter(d=>hdone(h,d)).length;ex+=h.f!=='w'?days.length:h.days&&h.days.length?days.filter(d=>h.days.includes(dow(d))).length:Math.max(1,Math.round(h.t*days.length/7))});return ex?Math.min(100,Math.round(dn/ex*100)):0}
function hsub(h,d){return h.auto?x('auto'):h.aw?`💧 ${wml(d)}/${wgoal()} ml`:h.f==='w'?(h.days&&h.days.length?sched(h):`${wk(h,d)}/${h.t} ${x('xw')}`):x('dly')}
function hrow(h,d,fut){const on=hdone(h,d),s=h.f!=='w'?streak(h):0;
return `<div class="hc ${on?'dn':''}"><span class="em">${esc(h.emoji)}</span><div class="grow"><div class="nm">${esc(h.name)}</div><div class="mut">${hsub(h,d)}</div></div>${s>1?`<span class="badge">🔥 ${s}</span>`:''}<button class="ck ${on?'on':''}" ${fut?'disabled style="opacity:.35"':''} onclick="A.tog(${h.id})">${on?'✓':''}</button></div>`}
function tkrow(k,d){return `<div class="row"><button class="chk ${k.done?'on':''}" onclick="A.tt(${k.id})">${k.done?'✓':''}</button><div class="grow ${k.done?'str':''}">${esc(k.name)}${k.date!==d?`<div class="mut">${fd(k.date)}</div>`:''}</div><button class="btn red" onclick="A.dt(${k.id})">✕</button></div>`}

function hoje(){const T=day(),d=SD,isT=d==T,fut=d>T,wd=wdays(d),nm=S.set.name,
dn=new Date(d+'T12:00').toLocaleDateString(LC(),{weekday:'long',day:'numeric',month:'long'}),tr=S.workouts.filter(w=>w.date===d),
hs=habsOn(d).sort((p,q)=>(hdone(p,d)?1:0)-(hdone(q,d)?1:0)),dh=hs.filter(h=>hdone(h,d)).length,
tk=S.tasks.filter(k=>k.date===d||(isT&&k.date<d&&!k.done)),op=tk.filter(k=>!k.done),cd=tk.filter(k=>k.done),up=S.tasks.filter(k=>!k.done&&k.date>d).sort((a,b)=>a.date<b.date?-1:1),
t=tot(d),G=goal(),kc=Math.round(t[0]);
return `<div class="hd"><div class="grow"><h1>${x('hi')}${nm?', '+esc(nm):''}</h1><div class="mut cap">${dn}</div></div>${isT?'':`<button class="btn alt sm" onclick="A.sd('${T}')">${x('hoje')}</button>`}</div>
<div class="wk"><button class="wnav" onclick="A.sw(-7)">‹</button>${wd.map(z=>`<button class="wd ${z==d?'on':''}" onclick="A.sd('${z}')"><span>${DN()[dow(z)].toLowerCase()}</span><b>${+z.slice(8)}</b>${z==T?'<i></i>':''}</button>`).join('')}<button class="wnav" onclick="A.sw(7)">›</button></div>
<div class="hero"><h2>${x('yday')}</h2><div class="rings3">
<button onclick="A.tab('habitos')">${ring(hs.length?dh/hs.length*100:0,78,8,`${dh}/${hs.length}`,'var(--c-hab)')}<span>${x('habitos')}</span></button>
<button onclick="ND='${d}';A.tab('nutri')">${ring(G[0]?kc/G[0]*100:0,78,8,kc,'var(--c-nut)')}<span>${x('of')} ${G[0]} kcal</span></button>
<button onclick="A.tab('treino')">${ring(tr.length?100:W&&isT?50:0,78,8,tr.length?'✓':W&&isT?'…':'–','var(--c-tr)')}<span>${x('treino')}</span></button></div></div>
<div class="sh"><span>${x('habitos')}<span class="cnt">${dh}/${hs.length}</span></span><button class="lnk" onclick="A.tab('habitos')">${x('mng')} ›</button></div>
${hs.map(h=>hrow(h,d,fut)).join('')||`<div class="card empty"><span class="em">🌱</span>${x('none')}</div>`}
<div class="sh"><span>${x('treino')}</span><button class="lnk" onclick="A.tab('treino')">${x('stk')} ›</button></div>
<div class="card">${tr.map(w=>`<div class="row" style="cursor:pointer" onclick="A.wd(${w.id})"><span style="font-size:22px">✅</span><div class="grow"><b>${esc(w.name)}</b><div class="mut">${w.dur} min · ${vol(w)} kg</div></div><span class="mut">›</span></div>`).join('')}
${isT?(W?`<button class="btn ar full" onclick="A.start()">▶ ${x('cw')}</button>`:`${tr.length?'':`<div class="mut">${x('nw')}</div>`}<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">${S.routines.map(r=>`<button class="btn alt sm" onclick="A.start(${r.id})">▶ ${esc(r.name)}</button>`).join('')}<button class="btn alt sm" onclick="A.start()">${x('fr')}</button></div>`):tr.length?'':`<div class="mut">${x('nod')}</div>`}</div>
<div class="sh"><span>${x('tarefas')}${op.length?`<span class="cnt">${op.length}</span>`:''}</span></div>
<div class="card"><div class="tadd"><input placeholder="${x('tph')}" value="${esc(HT.name)}" oninput="HT.name=this.value" onkeydown="if(event.key=='Enter')A.addT('${d}')"><button class="btn ar" onclick="A.addT('${d}')">＋</button></div>
${op.map(k=>tkrow(k,d)).join('')||`<div class="mut" style="margin-top:10px">${x('tnone')}</div>`}
${cd.length?`<details class="dt"><summary>✓ ${x('tdone')} (${cd.length})</summary>${cd.map(k=>tkrow(k,d)).join('')}</details>`:''}
${up.length?`<details class="dt"><summary>📅 ${x('up')} (${up.length})</summary>${up.map(k=>tkrow(k,d)).join('')}</details>`:''}</div>
<div class="card"><h2>${x('mood')}</h2><div class="moods">${mm.map((e,i)=>`<button class="${S.mood[d]===i+1?'on':''}" onclick="A.mood(${i+1})">${e}</button>`).join('')}</div></div>`}

function habitos(){const T=day(),wd=wdays().filter(d=>d<=T),pc=habPct(wd),open=HF.open||HF.id,ed=HF.id,eh=ed&&S.habits.find(y=>y.id==ed);
const form=`<div class="card" id="hform"><h2>${ed?x('edh'):x('nh')}</h2><div style="display:flex;gap:8px"><input placeholder="😀" value="${esc(HF.emoji)}" oninput="HF.emoji=this.value" style="width:64px;text-align:center"><input placeholder="${x('hph')}" value="${esc(HF.name)}" oninput="HF.name=this.value" style="text-align:left"></div>
<div class="seg" style="margin-top:10px"><button class="${HF.f=='d'?'on':''}" onclick="A.hf('f','d')">${x('dly')}</button><button class="${HF.f=='w'?'on':''}" onclick="A.hf('f','w')">${x('wkly')}</button></div>
${HF.f=='w'?`<div style="display:flex;align-items:center;gap:8px;margin-top:10px"><span class="grow">${x('tpw')}</span><input type="number" min="1" max="7" value="${HF.t}" onchange="A.hf('t',this.value)" style="width:70px"></div><div class="mut" style="margin:10px 0 4px">${x('wdy')} · ${x('maxd')}</div><div class="seg">${DN().map((n,i)=>`<button class="${HF.days.includes(i)?'on':''}" style="padding:8px 2px;font-size:13px" onclick="A.hd(${i})">${n}</button>`).join('')}</div>${HF.days.length?`<div class="mut" style="margin-top:6px">${x('hint')} (${HF.days.length}/${HF.t})</div>`:''}`:''}
<button class="btn ar full" onclick="A.addH()">${ed?x('sv'):x('add')}</button><button class="btn alt full" onclick="A.ch()">${x('cn')}</button>${eh&&!eh.auto?`<button class="btn red full" onclick="A.delH(${ed})">${x('dlh')}</button>`:''}</div>`;
return `<div class="hd"><div class="grow"><h1>${x('habitos')}</h1><div class="mut">${pc}% ${x('wpct')}</div></div>${open?'':`<button class="ibtn ar" onclick="A.nh()">＋</button>`}</div>
${open?form:''}
${S.habits.map(h=>{const s=h.f!=='w'?streak(h):0;return `<div class="card"><div style="display:flex;align-items:center;gap:12px"><span class="em" style="font-size:26px">${esc(h.emoji)}</span><div class="grow"><b style="font-size:17px">${esc(h.name)}</b><div class="mut">${sched(h)}${h.auto?' · '+x('auto'):''}</div></div>${s?`<span class="badge">🔥 ${s}</span>`:''}<button class="ibtn s" onclick="A.eh(${h.id})">✏️</button></div>
<div class="dots7">${[6,5,4,3,2,1,0].map(i=>{const d=back(i);return `<button class="${hdone(h,d)?'on':''} ${i==0?'td':''}" onclick="A.tog(${h.id},'${d}')"><span>${DN()[dow(d)].slice(0,3)}</span><i></i></button>`}).join('')}</div></div>`}).join('')||`<div class="card empty"><span class="em">🌱</span>${x('hnone')}</div>`}
${S.habits.length?`<div class="mut" style="text-align:center;margin-top:6px">${x('dsb')}</div>`:''}`}
