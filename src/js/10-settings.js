function openST(){ST=true;drawST()}
function closeST(){ST=false;$('#st').style.display='none';R()}
function drawST(){const nm=S.set.name,p=$('#st');p.style.display='block';
p.innerHTML=`<div class="w" style="padding-bottom:40px"><div style="display:flex;align-items:center"><h1 style="flex:1">${x('se')}</h1><button class="btn red" onclick="closeST()">✕</button></div><div class="card"><div class="mut">${x('yn')}</div><input value="${esc(nm)}" oninput="S.set.name=this.value;save()">
<div class="mut" style="margin-top:12px">${x('lg')}</div><div class="seg"><button class="${L=='pt'?'on':''}" onclick="A.lang('pt')">Português</button><button class="${L=='en'?'on':''}" onclick="A.lang('en')">English</button></div>
<div class="mut" style="margin:12px 0 6px">${x('tha')}</div><div class="sw">${Object.keys(TH).map(k=>{const t=TH[k]||['#09090b',0,0,0,'#4c8dff'];return `<button class="${S.set.theme==k?'on':''}" onclick="A.theme('${k}')"><span style="background:linear-gradient(90deg,${t[0]} 50%,${t[4]} 50%)"></span>${x('t'+k)}</button>`}).join('')}</div>
<div class="mut" style="margin-top:12px">${x('rd')}</div><input type="number" value="${S.set.rest}" oninput="S.set.rest=+this.value||0;save()">
<div class="mut" id="sy" style="margin-top:12px"></div></div></div>`;drawSY()}
