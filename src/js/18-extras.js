// Extras que juntam as 3 áreas: histórico por exercício (Hevy), peso corporal e cópia de dias (FatSecret),
// tendência semanal (Kiwi), resumo de nutrição no ecrã Hoje (Upwell) e cópia de segurança.

// --- gráfico de linha simples (SVG) ---
function lineChart(vals,labs,unit){if(!vals.length)return'';const W2=340,H2=130,p=24,mn=Math.min(...vals),mx=Math.max(...vals),rg=mx-mn||1,n=vals.length;
const X=i=>n<2?W2/2:p+i*(W2-2*p)/(n-1),Y=v=>H2-p-(v-mn)/rg*(H2-2*p),pts=vals.map((v,i)=>`${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(' ');
return `<svg viewBox="0 0 ${W2} ${H2}" width="100%" style="display:block;margin:6px 0"><polyline points="${pts}" fill="none" stroke="var(--ac)" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>${vals.map((v,i)=>`<circle cx="${X(i)}" cy="${Y(v)}" r="3.5" fill="var(--ac)"/>`).join('')}
<text x="2" y="${Y(mx)+4}" fill="var(--mut)" font-size="11">${r1(mx)}</text><text x="2" y="${Y(mn)+4}" fill="var(--mut)" font-size="11">${r1(mn)}</text>
<text x="${p}" y="${H2-4}" fill="var(--mut)" font-size="11">${labs[0]||''}</text><text x="${W2-p}" y="${H2-4}" fill="var(--mut)" font-size="11" text-anchor="end">${labs[n-1]||''} ${unit||''}</text></svg>`}

// --- histórico de um exercício (estilo Hevy) ---
const e1rm=(t,z)=>t=='wr'||t=='wb'?(z.reps>1?(z.kg||0)*(1+z.reps/30):(z.kg||0)):t=='ab'||t=='br'?(z.reps||0):t=='d'?(z.time||0):t=='dd'?(z.dist||0):(z.kg||0);
const eunit=t=>t=='wr'||t=='wb'||t=='dw'||t=='wd'?'kg':t=='ab'||t=='br'?'reps':t=='d'?'s':'km';
function openEH(n){const t=exInfo(n).t,ses=S.workouts.filter(w=>w.ex.some(e=>e.name===n)).map(w=>{const e=w.ex.find(y=>y.name===n),ss=e.sets.filter(z=>z.ty!='w'),b=ss.reduce((a,z)=>e1rm(t,z)>e1rm(t,a)?z:a,ss[0]||e.sets[0]);return{w,e,b,v:b?Math.round(e1rm(t,b)*10)/10:0}});
const last=ses.slice(-20),best=ses.reduce((a,s)=>s.v>(a?a.v:-1)?s:a,null),heavy=t=='wr'||t=='wb'?Math.max(0,...ses.flatMap(s=>s.e.sets.map(z=>z.kg||0))):0;
const p=$('#eh');p.style.display='block';
p.innerHTML=`<div class="w" style="padding-bottom:40px"><div style="display:flex;align-items:center;gap:6px"><h1 style="flex:1;font-size:24px">${esc(xn(n))}</h1><button class="btn red" onclick="closeEH()">✕</button></div><div class="mut">${gn(exInfo(n).g)} · ${x(t)}</div>`+
(ses.length?`<div class="kpi3" style="margin:14px 0"><div><span class="mut">${x('sess')}</span><b>${ses.length}</b></div><div><span class="mut">${t=='wr'||t=='wb'?x('e1'):x('mx')}</span><b>${best?best.v:0} ${eunit(t)}</b></div><div><span class="mut">${heavy?x('mx')+' kg':x('bst')}</span><b>${heavy?heavy:best?pfmt(t,best.b):'–'}</b></div></div>
<div class="card"><h2>${t=='wr'||t=='wb'?x('e1'):x('bst')}</h2>${lineChart(last.map(s=>s.v),last.map(s=>fd(s.w.date)),eunit(t))}</div>
<div class="sh"><span>${x('eh')}</span></div>${ses.slice().reverse().map(s=>`<div class="card" style="cursor:pointer" onclick="closeEH();A.wd(${s.w.id})"><div style="display:flex"><b class="grow">${esc(s.w.name)}</b><span class="mut">${fd(s.w.date)}</span></div>${s.e.note?`<div class="mut">📝 ${esc(s.e.note)}</div>`:''}${s.e.sets.map((z,j)=>`<div class="row"><span class="mut" style="width:28px">${z.ty&&z.ty!='n'?z.ty.toUpperCase():j+1}</span><span class="grow">${sfmt(t,z)}</span>${s.b===z?'<span class="pill">★</span>':''}</div>`).join('')}</div>`).join('')}`
:`<div class="card mut">${x('noex')}</div>`)+`</div>`}
function closeEH(){$('#eh').style.display='none'}

// --- peso corporal (estilo FatSecret) ---
function logW(v){v=+String(v).replace(',','.');if(!(v>20&&v<400))return;S.wlog[day()]=Math.round(v*10)/10;S.set.w=S.wlog[day()];save();R()}
function wcard(){const ks=Object.keys(S.wlog).sort(),l=ks.slice(-30),td=S.wlog[day()],lv=l.length?S.wlog[l[l.length-1]]:null,df=l.length>1?Math.round((lv-S.wlog[l[0]])*10)/10:0;
return `<div class="card"><div style="display:flex;align-items:baseline"><h2 style="flex:1;margin:0">⚖️ ${x('wtg')}</h2>${lv?`<b>${lv} kg</b>${l.length>1?`<span class="mut" style="margin-left:6px">${df>0?'+':''}${df}</span>`:''}`:''}</div>
${l.length>1?lineChart(l.map(k=>S.wlog[k]),l.map(fd),'kg'):l.length?'':`<div class="mut" style="margin:6px 0">${x('wtn')}</div>`}
<div style="display:flex;gap:8px;margin-top:8px"><input id="wti" type="number" inputmode="decimal" step="0.1" placeholder="${x('wtl')}" value="${td||''}"><button class="btn" onclick="logW($('#wti').value)">${x('sv')}</button></div></div>`}

// --- nutrição: recentes, copiar de ontem, tendência de 7 dias ---
function recentFoods(){const out=[],seen=new Set();for(let i=0;i<30&&out.length<8;i++){const lg=S.nlog[back(i)]||{};MEALS.forEach(m=>(lg[m]||[]).slice().reverse().forEach(e=>{if(!seen.has(e.n)&&fInfo(e.n)&&out.length<8){seen.add(e.n);out.push(fInfo(e.n))}}))}return out}
const yday=m=>{const q=new Date(ND+'T12:00');q.setDate(q.getDate()-1);return((S.nlog[day(q)]||{})[m]||[]).length};
function wkK(d){const ds=[6,5,4,3,2,1,0].map(i=>{const q=new Date(d+'T12:00');q.setDate(q.getDate()-i);return day(q)}),g=goal()[0]||1,v=ds.map(z=>Math.round(tot(z)[0])),mx=Math.max(g,...v),on=v.filter(y=>y>0),avg=on.length?Math.round(on.reduce((a,b)=>a+b,0)/on.length):0;
return `<div class="card"><div style="display:flex;align-items:baseline"><h2 style="flex:1;margin:0">${x('wkk')}</h2><span class="mut">Ø ${avg} kcal</span></div><div style="position:relative;margin-top:10px"><div style="position:absolute;left:0;right:0;bottom:${Math.round(g/mx*80)+16}px;border-top:1px dashed var(--mut);opacity:.6"></div><div class="bars">${ds.map((z,i)=>`<div><b style="height:${Math.round(v[i]/mx*80)}px;${v[i]>g*1.05?'background:#e5534b':''}"></b>${DN()[dow(z)][0]}</div>`).join('')}</div></div></div>`}

// --- cópia de segurança (exportar / importar JSON) ---
function bkExp(){const name='appgym-'+day()+'.json',data=JSON.stringify({app:'appgym',v:1,at:new Date().toISOString(),S});let file;try{file=new File([data],name,{type:'application/json'})}catch(e){file=new Blob([data],{type:'application/json'})}
if(navigator.canShare&&file instanceof File&&navigator.canShare({files:[file]})){navigator.share({files:[file],title:name}).catch(()=>{});return}
const a=document.createElement('a');a.href=URL.createObjectURL(file);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1500)}
function bkImp(inp){const f=inp.files&&inp.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const j=JSON.parse(r.result),d=j&&j.S?j.S:j;if(!d||!Array.isArray(d.habits)||!Array.isArray(d.workouts))throw 0;if(!confirm(x('bkq')))return;S=d;W=S.W||null;fix();save();alert(x('bko'));drawST();R()}catch(e){alert(x('bkn'))}};r.readAsText(f);inp.value=''}
const bkCard=()=>`<div class="card"><h2>💾 ${x('bk')}</h2><div class="mut" style="margin-bottom:8px">${x('bkh')}</div><button class="btn full" onclick="bkExp()">⬇️ ${x('bke')}</button><label class="btn alt full" style="display:block;text-align:center;cursor:pointer">⬆️ ${x('bki')}<input type="file" accept="application/json,.json" style="display:none" onchange="bkImp(this)"></label></div>`;
