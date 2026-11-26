// Pesquisa online de alimentos: Open Food Facts (produtos de marca, rótulos) e USDA FoodData Central (genéricos).
// Os alimentos escolhidos ficam guardados em S.cfoods (★) e passam a aparecer nos Recentes.
const USDA_KEY='DEMO_KEY'; // chave pública de demonstração (limite ~30 pesquisas/hora por IP)
// número do nutriente USDA -> índice em NU; [fator] converte unidades quando preciso
const USDAM={'208':0,'957':0,'958':0,'203':1,'205':2,'204':3,'291':4,'269':5,'606':6,'601':7,'307':8,'320':9,'401':10,'328':11,'323':12,'430':13,'404':14,'405':15,'406':16,'415':17,'435':18,'418':19,
'301':20,'303':21,'304':22,'305':23,'306':24,'309':25,'317':26,'645':27,'646':28,'605':29,'255':32,'221':33,'262':34,'410':35,'421':36,'312':37,'315':38,
'512':40,'503':41,'504':42,'505':43,'502':46,'501':47,'510':48,'539':51,'209':52,'213':53,'851':54,'629':55,'621':56,'675':57,'319':58,'321':59,'322':60,'337':61,'338':62,'325':63,'326':64,'428':66,'313':69,
'507':72,'509':73,'513':74,'511':75,'514':76,'515':77,'516':78,'517':79,'518':80};
let OS={src:'',q:'',st:'',res:[]};
function onlCard(){const q=(FS.q||'').trim(),ok=q.length>=3;return `<div class="card" style="margin-top:14px"><h2>🌍 ${x('onl')}</h2><div class="mut" style="margin-bottom:8px">${x('onlh')}</div>
<button class="btn ${ok?'':'alt'} full" ${ok?'':'disabled'} onclick="onlS('off')">${x('offb')}</button><button class="btn alt full" ${ok?'':'disabled'} onclick="onlS('usda')">${x('usdab')}</button><div id="ores">${onlRes()}</div></div>`}
function onlRes(){if(OS.q!==(FS.q||'').trim())return'';if(OS.st=='load')return `<div class="mut">${x('srch')}</div>`;if(OS.st=='err')return `<div class="mut">${x('neterr')}</div>`;if(OS.st=='ok'&&!OS.res.length)return `<div class="mut">${x('nores')}</div>`;
return OS.res.map((r,i)=>`<div class="row" style="cursor:pointer" onclick="onlPick(${i})"><div class="grow">${esc(r.n)}<div class="mut">${esc(r.b||'')}${r.b?' · ':''}${OS.src=='off'?'Open Food Facts':'USDA'}</div></div><span class="mut">${r.k!=null?Math.round(r.k)+' kcal':'›'}</span></div>`).join('')}
const drawOR=()=>{const e=$('#ores');if(e)e.innerHTML=onlRes()};
async function onlS(src){const q=(FS.q||'').trim();if(q.length<3)return;OS={src,q,st:'load',res:[]};drawOR();
try{if(src=='off'){const j=await (await fetch('https://search.openfoodfacts.org/search?q='+encodeURIComponent(q)+'&page_size=25&fields=code,product_name,brands,quantity')).json();
OS.res=(j.hits||[]).filter(h=>h.product_name&&h.code).map(h=>({id:h.code,n:h.product_name,b:[(h.brands||[]).map(b=>String(b).replace(/^xx:/,'')).join(', '),h.quantity].filter(Boolean).join(' · ')}))}
else{const j=await (await fetch('https://api.nal.usda.gov/fdc/v1/foods/search?api_key='+USDA_KEY+'&query='+encodeURIComponent(q)+'&dataType=Foundation,SR%20Legacy&pageSize=25')).json();if(j.error)throw j.error;
OS.res=(j.foods||[]).map(f=>({id:f.fdcId,n:f.description,b:f.foodCategory||'',k:(f.foodNutrients||[]).find(z=>['208','957','958'].includes(String(z.nutrientNumber)))?.value,raw:f}))}
OS.st='ok'}catch(e){OS.st='err'}if(OS.q===(FS.q||'').trim())drawOR()}
function usdaFood(f){const v=Array(NU.length).fill(0),seen={};(f.foodNutrients||[]).forEach(z=>{const k=String(z.nutrientNumber),i=USDAM[k];if(i===undefined||!(+z.value>=0))return;
if(i===0){if(seen.k&&k!='208')return;if(k=='208')seen.k=1}v[i]=Math.round(z.value*1000)/1000;seen[k]=+z.value});
v[44]=(seen['506']||0)+(seen['507']||0);v[45]=(seen['508']||0)+(seen['509']||0);v[30]=(seen['851']||0)+(seen['629']||0)+(seen['621']||0)+(seen['631']||0);v[31]=seen['675']||seen['618']||0;if(!v[57])v[57]=v[31];
if(!v[0])v[0]=Math.round(4*v[1]+4*v[2]+9*v[3]);let n=f.description+' (USDA)';if(fInfo(n))n+=' '+f.fdcId;return{n,c:'★',u:100,v,src:'USDA'}}
async function onlPick(i){const r=OS.res[i];if(!r)return;let f=null;
if(OS.src=='usda'){const ex=S.cfoods.find(c=>c.src=='USDA'&&c.n.startsWith(r.n+' (USDA)'));f=ex||usdaFood(r.raw);if(!ex)S.cfoods.push(f)}
else{const known=S.barcodes[r.id];if(known&&fInfo(known))f=fInfo(known);else{OS.st='load';drawOR();try{const j=await (await fetch('https://world.openfoodfacts.org/api/v2/product/'+encodeURIComponent(r.id)+'.json?fields=product_name,brands,nutriments,serving_quantity')).json();
if(!j||j.status!=1)throw 0;f=offFood(j.product,r.id);f.src='Open Food Facts';S.cfoods.push(f);S.barcodes[r.id]=f.n}catch(e){OS.st='err';drawOR();return}}}
save();OS.st='ok';FS.sel=f.n;FS.g=f.u||100;drawFD()}
