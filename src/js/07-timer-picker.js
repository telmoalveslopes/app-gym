function rest(s){RT={left:s,p:0};drawRT()}
function rtP(){if(RT){RT.p=!RT.p;drawRT()}}
function rtA(d){if(RT){RT.left=Math.max(1,RT.left+d);drawRT()}}
function drawRT(){const r=$('#rt');r.style.display=RT?'flex':'none';if(RT){$('#rtt').textContent=mmss(RT.left);$('#rtp').textContent=RT.p?'▶':'⏸'}}
function beep(){try{navigator.vibrate&&navigator.vibrate([200,100,200]);const c=new AudioContext(),o=c.createOscillator();o.connect(c.destination);o.frequency.value=880;o.start();o.stop(c.currentTime+.4)}catch(e){}}
setInterval(()=>{if(RT&&!RT.p){RT.left--;if(RT.left<=0){RT=null;beep()}drawRT()}},1000);
function openPK(cb){PK={cb,sel:[],q:'',g:'',mk:null};drawPK()}
function closePK(){PK=null;$('#pk').style.display='none'}
function donePK(){const c=PK.cb,l=PK.sel;closePK();c(l)}
function togPK(n){const i=PK.sel.indexOf(n);i<0?PK.sel.push(n):PK.sel.splice(i,1);listPK()}
function saveEx(){const m=PK.mk,n=m.n.trim();if(!n)return;if(!EXM.has(n)&&!S.custom.some(c=>c.n==n))S.custom.push({n,g:m.g,t:m.t});if(!PK.sel.includes(n))PK.sel.push(n);PK.mk=null;save();drawPK()}
function drawPK(){const p=$('#pk'),m=PK.mk;p.style.display='block';
p.innerHTML=`<div class="w" style="padding-bottom:0"><div style="display:flex;align-items:center;gap:6px"><h1 style="flex:1">${x('ex')}</h1>${m?'':`<button class="btn alt sm" onclick="PK.mk={n:PK.q.trim(),g:PK.g||'Peito',t:'wr'};drawPK()">${x('ce')}</button>`}<button class="btn red" onclick="closePK()">✕</button></div>`+
(m?`<div class="card"><h2>${x('nm')}</h2><input value="${esc(m.n)}" oninput="PK.mk.n=this.value"><h2 style="margin-top:12px">${x('mg')}</h2><select onchange="PK.mk.g=this.value">${Object.keys(LIB).map(g=>`<option value="${g}" ${m.g==g?'selected':''}>${gn(g)}</option>`).join('')}</select><h2 style="margin-top:12px">${x('ty')}</h2><select onchange="PK.mk.t=this.value">${Object.keys(FT).map(t=>`<option value="${t}" ${m.t==t?'selected':''}>${x(t)}</option>`).join('')}</select><button class="btn full" onclick="saveEx()">${x('sv')}</button><button class="btn red full" onclick="PK.mk=null;drawPK()">${x('cn')}</button></div>`
:`<input id="pq" placeholder="${x('sx')}" oninput="PK.q=this.value;listPK()"><div class="chips">${['',...Object.keys(LIB)].map(g=>`<button class="chip ${PK.g===g?'on':''}" onclick="PK.g=this.dataset.g;drawPK()" data-g="${g}">${g?gn(g):x('al')}</button>`).join('')}</div><div id="pl"></div><div class="pkf"><button class="btn" style="width:100%" id="pb" onclick="donePK()"></button></div>`)+`</div>`;
if(!m){$('#pq').value=PK.q;listPK()}}
function listPK(){const q=norm(PK.q);let last='';const all=[...EX,...S.custom.map(c=>({...c,c:1}))].filter(e=>(!PK.g||e.g===PK.g)&&norm(e.n+' '+xn(e.n)).includes(q)).sort((a,b)=>xn(a.n).localeCompare(xn(b.n),L));
$('#pl').innerHTML=all.map(e=>{const l=xn(e.n)[0].toUpperCase(),h=l!==last?`<h2 style="margin-top:12px">${last=l}</h2>`:'';return h+`<label class="row"><input type="checkbox" ${PK.sel.includes(e.n)?'checked':''} data-n="${esc(e.n)}" onchange="togPK(this.dataset.n)"><span class="grow">${e.c?'★ ':''}${esc(xn(e.n))}<div class="mut">${x(e.t)}</div></span><span class="mut">${gn(e.g)}</span></label>`}).join('');
$('#pb').textContent=`${x('add')} (${PK.sel.length})`}
