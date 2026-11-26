function R(){$('#m').innerHTML={hoje,habitos,treino,nutri,perfil}[tab]();$('#gear').style.display=(tab=='treino'&&W)?'none':'block';
$('#n').innerHTML=['hoje','habitos','treino','nutri','perfil'].map(k=>`<button class="${tab===k?'on':''}" onclick="A.tab('${k}')">${icon(k)}<span>${x(k)}</span></button>`).join('');drawSY();updTM()}
const updTM=()=>{const t=$('#tm');if(t&&W)t.textContent=mmss(Math.floor((Date.now()-W.t)/1e3))};setInterval(updTM,1000);
R();initDB();

