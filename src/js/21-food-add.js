// ===== Nutrição: refeições com nomes à escolha, refeições guardadas e ecrã de adicionar alimento =====
// S.meals = [{k,n?,off?}] lista das refeições do dia (k = chave em S.nlog[dia]; n = nome dado pela pessoa; off = escondida).
//   Esconder uma refeição nunca apaga nada: os alimentos já registados nela continuam a aparecer e a contar.
// S.cmeals = [{id,n,items:[{n,g}]}] refeições personalizadas (combinações de alimentos para adicionar de uma vez).
const mealsOn=()=>S.meals.filter(m=>!m.off).map(m=>m.k);
const mname=k=>{const m=S.meals.find(y=>y.k==k);return m&&m.n&&m.n.trim()?m.n.trim():D['m_'+k]?x('m_'+k):x('mnew')};
const mealList=d=>{const on=mealsOn(),lg=S.nlog[d]||{};return[...on,...Object.keys(lg).filter(k=>k!='w'&&Array.isArray(lg[k])&&lg[k].length&&!on.includes(k))]};
const nit=n=>n+" "+x(n==1?"itm1":"itms"),fkc=l=>l.reduce((a,e)=>{const f=fInfo(e.n);return a+(f?f.v[0]*e.g/100:0)},0);

// --- adicionar alimento: primeiro o que já comeste (dias anteriores, recentes, refeições guardadas); pesquisar é um passo à parte ---
function openFD(m){FS={m,v:'home',tab:'rec',q:'',c:'',sel:null,g:100,mk:null,cm:null,pick:0};drawFD()}
function closeFD(){FS=null;$('#fd').style.display='none'}
function drawFD(){const p=$('#fd'),s=FS;p.style.display='block';const bld=s.cm&&!s.pick,srch=s.v=='search'&&!s.sel&&!s.mk&&!bld;
const title=s.mk?x('cf').replace('+ ',''):bld?(s.cm.id?x('cmed'):x('cmnew')):s.pick?x('cmadd'):mname(s.m);
const head=`<div style="display:flex;align-items:center;gap:6px">${srch?`<button class="btn alt sm" onclick="fdBack()">←</button>`:''}<h1 style="flex:1;font-size:24px">${esc(title)}</h1>${s.sel||s.mk||bld?'':`<button class="btn alt sm" onclick="FS.mk={n:FS.q.trim(),v:['','','','','']};drawFD()">${x('cf')}</button><button class="btn alt sm" onclick="openBC()">▦</button>`}<button class="btn red" onclick="closeFD()">✕</button></div>`;
const body=s.mk?mkF():s.sel?selF():bld?cmF():srch?`<input id="fq" placeholder="${x('srchf')}" oninput="FS.q=this.value;listFD()"><div class="chips">${['',...Object.keys(FDB),'★'].map(c=>`<button class="chip ${s.c===c?'on':''}" data-c="${c}" onclick="FS.c=this.dataset.c;drawFD()">${c?cat(c):x('al')}</button>`).join('')}</div><div id="fl"></div>`:fdHome();
p.innerHTML=`<div class="w" style="padding-bottom:40px">${head}${body}</div>`;
if(srch){const q=$('#fq');q.value=s.q;listFD();if(s.foc){s.foc=0;q.focus()}}if(s.sel)pvF()}
function fdBack(){FS.q='';FS.c='';if(FS.pick)FS.pick=0;FS.v='home';drawFD()}
function listFD(){const q=norm(FS.q),all=[...S.cfoods.map(f=>({...f,c:'★'})),...FOODS].filter(f=>(!FS.c||f.c===FS.c)&&norm(f.n+' '+xn(f.n)).includes(q)).sort((a,b)=>xn(a.n).localeCompare(xn(b.n),L));
const rw=f=>`<div class="row" data-n="${esc(f.n)}" onclick="FS.sel=this.dataset.n;FS.g=fInfo(FS.sel).u||100;drawFD()"><div class="grow">${f.c=='★'?'★ ':''}${esc(xn(f.n))}<div class="mut">${f.c=='★'?'':cat(f.c)+' · '}${f.u} g</div></div><span class="mut">${f.v[0]} kcal/100g</span></div>`;
$('#fl').innerHTML=((FS.q||'').trim().length>=3?onlCard():'')+all.map(rw).join('')}

// dias anteriores com esta refeição (sem repetir combinações iguais)
const fsig=l=>l.map(e=>e.n+'@'+e.g).sort().join('|');
function prevDays(){const o=[];for(let i=1;i<=21&&o.length<3;i++){const q=new Date(ND+'T12:00');q.setDate(q.getDate()-i);const d=day(q),l=((S.nlog[d]||{})[FS.m]||[]).filter(e=>fInfo(e.n));if(l.length&&!o.some(z=>z.sig==fsig(l)))o.push({d,l,i,sig:fsig(l)})}return o}
const dlab=(d,i)=>i==1?x('yest'):new Date(d+'T12:00').toLocaleDateString(LC(),{weekday:'long',day:'numeric',month:'short'});
// alimentos recentes com a última quantidade usada
function recentFG(n){const out=[],seen=new Set();for(let i=0;i<60&&out.length<n;i++){const lg=S.nlog[back(i)]||{};Object.keys(lg).filter(m=>m!='w'&&Array.isArray(lg[m])).forEach(m=>lg[m].slice().reverse().forEach(e=>{const f=fInfo(e.n);if(f&&!seen.has(e.n)&&out.length<n){seen.add(e.n);out.push([f,e.g])}}))}return out}
function fRow(f,g){return `<div class="row"><div class="grow" style="cursor:pointer" data-n="${esc(f.n)}" data-g="${g}" onclick="FS.sel=this.dataset.n;FS.g=+this.dataset.g;drawFD()">${esc(xn(f.n))}<div class="mut">${g} g · ${Math.round(f.v[0]*g/100)} kcal</div></div><button class="qadd" data-n="${esc(f.n)}" onclick="qAdd(this.dataset.n,${g},this)">＋</button></div>`}
function fdHome(){const s=FS,rf=recentFG(20),pd=prevDays();
const search=`<button class="fsrch" onclick="FS.v='search';FS.foc=1;drawFD()"><span>🔍</span>${x('srchf')}</button>`;
const tabs=`<div class="seg tabs">${[['rec',x('rcnt')],['ml',x('cmeals')],['my',x('myf')]].map(([k,l])=>`<button class="${s.tab==k?'on':''}" onclick="FS.tab='${k}';drawFD()">${l}</button>`).join('')}</div>`;
let b='';
if(s.tab=='rec')b=(pd.length?`<h2 style="margin-top:14px">📅 ${x('prevd')}</h2>`+pd.map(z=>`<div class="card fday"><div style="display:flex;align-items:center;gap:8px"><div class="grow"><b class="cap">${dlab(z.d,z.i)}</b><div class="mut">${nit(z.l.length)} · ${Math.round(fkc(z.l))} kcal</div></div><button class="btn ar sm" onclick="addDay('${z.d}')">＋ ${x('addall')}</button></div><div class="mut clamp" style="margin:6px 0 0">${z.l.map(e=>esc(xn(e.n))+' '+e.g+' g').join(' · ')}</div></div>`).join(''):'')
+`<h2 style="margin-top:14px">🕘 ${x('rfood')}</h2>`+(rf.length?`<div class="card" style="padding-top:2px;padding-bottom:2px">${rf.map(([f,g])=>fRow(f,g)).join('')}</div>`:`<div class="card empty">${x('rnone2')}</div>`);
else if(s.tab=='ml')b=`<button class="btn ar full" onclick="FS.cm={n:'',items:[]};drawFD()">＋ ${x('cmnew')}</button>`+(S.cmeals.length?S.cmeals.map(c=>`<div class="card"><div style="display:flex;align-items:center;gap:8px"><div class="grow"><b>${esc(c.n)}</b><div class="mut">${nit(c.items.length)} · ${Math.round(fkc(c.items))} kcal</div></div><button class="ibtn s" onclick="editCM(${c.id})">✏️</button><button class="btn ar sm" onclick="addCM(${c.id})">＋</button></div><div class="mut clamp" style="margin:6px 0 0">${c.items.map(e=>esc(xn(e.n))+' '+e.g+' g').join(' · ')}</div></div>`).join(''):`<div class="card empty">${x('cmnone')}</div>`);
else b=S.cfoods.length?`<div class="card" style="padding-top:2px;padding-bottom:2px">${S.cfoods.slice().reverse().map(f=>fRow(f,f.u||100)).join('')}</div>`:`<div class="card empty">${x('myfn')}</div>`;
return search+tabs+b}
function logAdd(l){const d=ND,a=S.nlog[d]=S.nlog[d]||{};a[FS.m]=(a[FS.m]||[]).concat(l.map(e=>({n:e.n,g:+e.g||0})));saveN(d)}
function qAdd(n,g,b){logAdd([{n,g}]);R();if(b){b.textContent='✓';b.classList.add('on');b.disabled=true}}
function addDay(d){logAdd((S.nlog[d]||{})[FS.m]||[]);closeFD();R()}
function addCM(id){const c=S.cmeals.find(y=>y.id==id);if(!c)return;logAdd(c.items);closeFD();R()}

// --- escolher a quantidade (ecrã de um alimento) ---
const MACC=[[1,'#6fd69a',['Proteína','Protein'],4],[2,'#3cc8d8',['Hidratos','Carbs'],4],[3,'#b878d0',['Gordura','Fat'],9]];
function selF(){const f=fInfo(FS.sel),pk=FS.pick;return `<div class="fsel"><div class="fnm">${esc(xn(f.n))}</div><div class="mut">${f.src?x('srcf')+': '+esc(f.src):FM.has(f.n)?'≈ '+x('apx'):''}${f.lb?' · '+x('lbn'):''}</div>
<div id="fp"></div>
<div class="qty"><button onclick="fG(-10)">−</button><label><input id="fgi" type="number" inputmode="decimal" value="${FS.g}" oninput="FS.g=+String(this.value).replace(',','.')||0;pvF()"><span>g</span></label><button onclick="fG(10)">+</button></div>
<div class="chips" style="justify-content:center;flex-wrap:wrap">${[f.u,50,100,150,200,250].filter((v,i,a)=>v&&a.indexOf(v)==i).map(v=>`<button class="chip" onclick="FS.g=${v};$('#fgi').value=${v};pvF()">${v} g</button>`).join('')}</div>
${pk?'':`<h2 style="margin:14px 0 4px">${x('tomeal')}</h2><div class="chips">${mealsOn().map(k=>`<button class="chip ${FS.m==k?'on':''}" onclick="FS.m='${k}';drawFD()">${esc(mname(k))}</button>`).join('')}</div>`}
<div class="mut" style="margin:8px 0;font-size:13px">${x('p100')}: ${f.v[0]} kcal · P ${f.v[1]} · C ${f.v[2]} · F ${f.v[3]}</div>
<button class="btn ar big full" onclick="addF()">${pk?x('cmadd'):x('add')+' · '+esc(mname(FS.m))}</button><button class="btn alt full" onclick="FS.sel=null;drawFD()">${x('cn')}</button></div>`}
function fG(d){FS.g=Math.max(0,Math.round((+FS.g||0)+d));const e=$('#fgi');if(e)e.value=FS.g;pvF()}
function pvF(){const f=fInfo(FS.sel),k=(+FS.g||0)/100,e=$('#fp');if(!e)return;const cal=MACC.map(([i,,,m])=>f.v[i]*m),ct=cal.reduce((a,b)=>a+b,0)||1;let acc=0;
const cg=ct>0&&cal.some(v=>v)?MACC.map(([,c],j)=>{const a=acc;acc+=cal[j]/ct*100;return `${c} ${a}% ${acc}%`}).join(','):'var(--bd) 0 100%';
e.innerHTML=`<div class="fmac"><div class="donut" style="background:conic-gradient(${cg})"><div><b>${Math.round(f.v[0]*k)}</b><span>kcal</span></div></div><div class="ftiles">${MACC.map(([i,c,l],j)=>`<div style="--c:${c}"><span>${l[L=='en'?1:0]}</span><b>${r1(f.v[i]*k)} g</b><i><u style="width:${Math.round(cal[j]/ct*100)}%"></u></i></div>`).join('')}</div></div>`}
function addF(){if(FS.pick){FS.cm.items.push({n:FS.sel,g:+FS.g||0});FS.sel=null;FS.pick=0;FS.v='home';FS.q='';drawFD();return}logAdd([{n:FS.sel,g:FS.g}]);closeFD();R()}

// --- refeições personalizadas ---
function editCM(id){FS.cm=JSON.parse(JSON.stringify(S.cmeals.find(y=>y.id==id)));drawFD()}
function cmF(){const c=FS.cm;return `<div class="card"><h2>${x('nm')}</h2><input value="${esc(c.n)}" placeholder="${x('cmph')}" oninput="FS.cm.n=this.value">
<h2 style="margin-top:14px">${x('itmsT')} · ${Math.round(fkc(c.items))} kcal</h2>${c.items.map((e,i)=>`<div class="row"><div class="grow">${esc(xn(e.n))}</div><input type="number" inputmode="decimal" style="width:76px;text-align:center" value="${e.g}" onchange="FS.cm.items[${i}].g=+this.value||0;drawFD()"><span class="mut">g</span><button class="btn red" onclick="FS.cm.items.splice(${i},1);drawFD()">✕</button></div>`).join('')||`<div class="mut">${x('cmempty')}</div>`}
<button class="btn alt full" onclick="FS.pick=1;FS.v='search';FS.q='';FS.foc=1;drawFD()">＋ ${x('cmadd')}</button></div>
<button class="btn ar full" onclick="saveCM()">${x('sv')}</button><button class="btn alt full" onclick="FS.cm=null;drawFD()">${x('cn')}</button>${c.id?`<button class="btn red full" onclick="delCM(${c.id})">${x('dlcm')}</button>`:''}`}
function saveCM(){const c=FS.cm;if(!c.n.trim()||!c.items.length)return alert(x('cmreq'));const o={n:c.n.trim(),items:c.items.map(e=>({n:e.n,g:+e.g||0}))};const ex=c.id&&S.cmeals.find(y=>y.id==c.id);if(ex)Object.assign(ex,o);else S.cmeals.push({id:Date.now(),...o});FS.cm=null;FS.tab='ml';save();drawFD()}
function delCM(id){const c=S.cmeals.find(y=>y.id==id);if(!c||!confirm(x('dlq').replace('{n}',c.n)))return;S.cmeals=S.cmeals.filter(y=>y.id!=id);FS.cm=null;save();drawFD()}
function saveAsCM(m){const l=(S.nlog[ND]||{})[m]||[];if(!l.length)return;const n=prompt(x('cmph'),mname(m));if(!n||!n.trim())return;S.cmeals.push({id:Date.now(),n:n.trim(),items:l.map(e=>({n:e.n,g:e.g}))});save();alert(x('cmok'))}

// --- editar a lista de refeições (nomes, ordem, acrescentar, esconder) ---
function openML(){drawML()}
function closeML(){$('#ml').style.display='none';R()}
function drawML(){const p=$('#ml');p.style.display='block';const off=S.meals.filter(m=>m.off);
p.innerHTML=`<div class="w" style="padding-bottom:40px"><div style="display:flex;align-items:center"><h1 style="flex:1">${x('mled')}</h1><button class="btn red" onclick="closeML()">✕</button></div><div class="mut" style="margin-top:6px">${x('mlh')}</div>
<div class="card">${S.meals.map((m,i)=>m.off?'':`<div class="row"><input value="${esc(m.n||'')}" placeholder="${esc(D['m_'+m.k]?x('m_'+m.k):x('mnew'))}" oninput="S.meals[${i}].n=this.value;save()" style="flex:1;min-width:0"><button class="btn alt sm" onclick="mlMv(${i},-1)">▲</button><button class="btn alt sm" onclick="mlMv(${i},1)">▼</button><button class="btn red" onclick="mlOff(${i})">✕</button></div>`).join('')}
<button class="btn ar full" onclick="S.meals.push({k:'m'+Date.now(),n:x('mnew')});save();drawML()">＋ ${x('mladd')}</button></div>
${off.length?`<div class="card"><h2>${x('mlhid')}</h2>${off.map(m=>`<div class="row"><span class="grow">${esc(mname(m.k))}</span><button class="btn alt sm" onclick="S.meals[${S.meals.indexOf(m)}].off=0;save();drawML()">${x('mlres')}</button></div>`).join('')}<div class="mut" style="margin-top:6px">${x('mlkeep')}</div></div>`:''}</div>`}
function mlMv(i,d){const a=S.meals;let j=i+d;while(j>=0&&j<a.length&&a[j].off)j+=d;if(j<0||j>=a.length)return;[a[i],a[j]]=[a[j],a[i]];save();drawML()}
function mlOff(i){if(mealsOn().length<=1)return;S.meals[i].off=1;save();drawML()}

Object.assign(D,{m_s:['Lanche','Snack'],cmed:['Editar refeição','Edit meal'],cmnew:['Criar refeição','Create meal'],cmadd:['Adicionar alimento','Add food'],yest:['Ontem','Yesterday'],cmeals:['Refeições','Meals'],myf:['Os meus','My foods'],
prevd:['Dias anteriores','Previous days'],itms:['alimentos','foods'],itm1:['alimento','food'],addall:['Tudo','All'],rfood:['Alimentos recentes','Recent foods'],rnone2:['Ainda não registaste alimentos. Usa a pesquisa acima.','No foods logged yet. Use the search above.'],
cmnone:['Guarda combinações que comes muitas vezes (ex.: "Pequeno-almoço habitual") para as adicionar de uma vez.','Save combos you eat often (e.g. "Usual breakfast") to add them in one tap.'],myfn:['Os alimentos que criares ou encontrares online aparecem aqui.','Foods you create or find online show up here.'],
cmph:['Nome da refeição','Meal name'],itmsT:['Alimentos','Foods'],cmempty:['Ainda sem alimentos.','No foods yet.'],dlcm:['Apagar refeição','Delete meal'],cmreq:['Dá um nome e adiciona pelo menos um alimento.','Give it a name and add at least one food.'],
tomeal:['Adicionar a','Add to'],mled:['Editar refeições','Edit meals'],mlh:['Muda os nomes, a ordem, ou acrescenta refeições (ex.: Pré-treino, Ceia).','Rename, reorder or add meals (e.g. Pre-workout, Supper).'],mladd:['Adicionar refeição','Add meal'],
mlhid:['Escondidas','Hidden'],mlres:['Mostrar','Show'],mlkeep:['Os alimentos já registados numa refeição escondida não se perdem.','Foods already logged in a hidden meal are kept.'],mnew:['Nova refeição','New meal'],cmok:['Refeição guardada. Encontras em ＋ → Refeições.','Meal saved. Find it under ＋ → Meals.'],svcm:['Guardar como refeição','Save as meal']});
