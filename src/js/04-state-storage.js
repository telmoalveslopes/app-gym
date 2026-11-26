let S=null;try{S=JSON.parse(localStorage.getItem(K))}catch(e){}
S=S||{habits:[{id:1,name:'Beber água',emoji:'💧',done:{}},{id:2,name:'Treinar',emoji:'🏋️',done:{},auto:1},{id:3,name:'Dormir 8h',emoji:'😴',done:{}}],mood:{},workouts:[],
routines:[{id:1,name:'Push',ex:[['Supino reto com barra',3],['Press de ombros com halteres',3],['Extensão no cabo com corda',3]]},{id:2,name:'Pull',ex:[['Puxada à frente',3],['Remada com barra',3],['Rosca com barra EZ',3]]},{id:3,name:'Pernas',ex:[['Agachamento livre',3],['Leg press',3],['Elevação de gémeos em pé',3]]}]};
const day=(d=new Date())=>new Date(d-d.getTimezoneOffset()*6e4).toISOString().slice(0,10);
function fix(){S.set=Object.assign({lang:null,theme:'auto',rest:90,name:'',sex:'m',age:30,w:70,h:175,act:1.55,goal:'maint',mode:'auto',gk:2200,gp:150,gc:250,gf:70,gfi:30},S.set);S.exRest=S.exRest||{};S.barcodes=S.barcodes||{};S.tasks=S.tasks||[];S.nlog=S.nlog||{};S.cfoods=S.cfoods||[];S.custom=S.custom||[];S.since=S.since||day();S.workouts=S.workouts||[];L=S.set.lang||((navigator.language||'pt').startsWith('pt')?'pt':'en');document.documentElement.lang=L;applyTheme()}
let NR=0,WMN=0,WD=null,WE=0,WM=0,WDEL=0,SD=day(),ND=day(),FS=null,HTF=0,TRIED=false,CM=0,SM=null,ST=false,CD=day(),W=S.W||null,tab='hoje',P='w',M='n',RB=null,PK=null,RT=null,HF={f:'d',days:[],t:3,name:'',emoji:''},HT={name:'',date:day()};
fix();
let DBC=null,SY='sl',SYT=0,LOADED=false,tmr=null;
const core=()=>{const c={...S};delete c.workouts;delete c.nlog;return c};
function drawSY(){const e=$('#sy');if(e)e.textContent=x(SY)+(SY=='so'&&SYT?' · '+new Date(SYT).toLocaleTimeString(LC(),{hour:'2-digit',minute:'2-digit'}):'')}
function save(){S.W=W;try{localStorage.setItem(K,JSON.stringify(S))}catch(e){}
if(DBC&&LOADED){clearTimeout(tmr);SY='sg';drawSY();tmr=setTimeout(()=>DBC.doc('core').set({j:JSON.stringify(core())}).then(()=>{SY='so';SYT=Date.now();drawSY()}).catch(()=>{SY='er';drawSY()}),600)}}
async function initDB(){try{if(!window.claude||!claude.use)return;const lim=new Promise((_,r)=>setTimeout(r,10000));
const [db,us]=await Promise.race([Promise.all([claude.use('db'),claude.use('user')]),lim]);if(!db||!us)return;
const id=await us.id();DBC=db.collection('data/users/'+id);SY='sg';drawSY();
const snap=await DBC.get();let c=null;const ws=[],nl={};snap.docs.forEach(d=>{const j=JSON.parse(d.data().j);if(d.id=='core')c=j;else if(d.id.startsWith('n_'))nl[d.id.slice(2)]=j;else if(!j.del)ws.push(j)});
if(c){S=Object.assign(S,c);S.workouts=ws.sort((a,b)=>a.id-b.id);S.nlog=nl;W=S.W||null}
else{await DBC.doc('core').set({j:JSON.stringify(core())});for(const w of S.workouts)await DBC.doc('w_'+w.id).set({j:JSON.stringify(w)});S.nlog=S.nlog||{};for(const k in S.nlog)await DBC.doc('n_'+k).set({j:JSON.stringify(S.nlog[k])})}
fix();LOADED=true;SY='so';SYT=Date.now();R()}catch(e){SY=LOADED?'er':'sl'}finally{TRIED=true;if(!LOADED)R();drawSY()}}
