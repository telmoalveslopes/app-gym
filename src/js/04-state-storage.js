// ===== Estado e armazenamento local =====
// Os dados vivem em localStorage (chave K = 'appgym1') e, se houver conta, também na nuvem (20-cloud.js).
// REGRAS para nunca perder dados:
//  1. fix() só ACRESCENTA campos em falta; nunca apaga nem renomeia dados antigos.
//  2. Se os dados guardados estiverem corrompidos, NÃO se escreve por cima: guarda-se uma cópia e tenta-se a cópia diária.
//  3. Uma cópia por dia fica no aparelho (últimos LBK_KEEP dias) e outra na nuvem (tabela app_backups).
const SV=2; // versão do formato dos dados (subir só com migração que acrescenta campos)
const DEF=()=>({habits:[{id:1,name:'Beber água',emoji:'💧',done:{}},{id:2,name:'Treinar',emoji:'🏋️',done:{},auto:1},{id:3,name:'Dormir 8h',emoji:'😴',done:{}}],mood:{},workouts:[],
routines:[{id:1,name:'Push',ex:[['Supino reto com barra',3],['Press de ombros com halteres',3],['Extensão no cabo com corda',3]]},{id:2,name:'Pull',ex:[['Puxada à frente',3],['Remada com barra',3],['Rosca com barra EZ',3]]},{id:3,name:'Pernas',ex:[['Agachamento livre',3],['Leg press',3],['Elevação de gémeos em pé',3]]}]});
const day=(d=new Date())=>new Date(d-d.getTimezoneOffset()*6e4).toISOString().slice(0,10);
const validS=j=>!!(j&&typeof j=='object'&&Array.isArray(j.habits));
// --- cópias diárias no aparelho ---
const LBK_KEEP=7,LBK_P=K+'_bak_';
const LBK={keys(){const o=[];for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.startsWith(LBK_P))o.push(k)}return o.sort().reverse()},
get(k){try{const j=JSON.parse(localStorage.getItem(k));return validS(j)?j:null}catch(e){return null}},
latest(){for(const k of this.keys()){const j=this.get(k);if(j)return j}return null},
snap(tag){if(!S)return;const k=LBK_P+day()+(tag?'_'+tag+'_'+Date.now():'');if(!tag&&localStorage.getItem(k))return;try{localStorage.setItem(k,JSON.stringify(S))}catch(e){}
const ks=this.keys();ks.filter(k=>!k.includes('_',LBK_P.length+10)).slice(LBK_KEEP).forEach(k=>localStorage.removeItem(k));ks.filter(k=>k.includes('_',LBK_P.length+10)).slice(5).forEach(k=>localStorage.removeItem(k))}};
let RECOVERED=0;
function readLocal(){const raw=localStorage.getItem(K);if(raw==null)return null;try{const j=JSON.parse(raw);if(validS(j))return j;throw 0}catch(e){try{localStorage.setItem(K+'_corrupt_'+Date.now(),raw)}catch(_){}RECOVERED=1;return LBK.latest()}}
let S=readLocal();const FRESH=!S;S=S||DEF();
function fix(){S.set=Object.assign({lang:null,theme:'auto',rest:90,name:'',sex:'m',age:30,w:70,h:175,act:1.55,goal:'maint',mode:'auto',gk:2200,gp:150,gc:250,gf:70,gfi:30},S.set);S.exRest=S.exRest||{};S.barcodes=S.barcodes||{};S.tasks=S.tasks||[];S.nlog=S.nlog||{};S.cfoods=S.cfoods||[];S.custom=S.custom||[];S.since=S.since||day();S.workouts=S.workouts||[];S.wlog=S.wlog||{};S.mood=S.mood||{};S.routines=S.routines||[];S.habits.forEach(h=>{h.done=h.done||{};if(h.aw===undefined)h.aw=h.id===1&&/água|water/i.test(h.name)?1:0});S.v=Math.max(S.v||1,SV);L=S.set.lang||((navigator.language||'pt').startsWith('pt')?'pt':'en');document.documentElement.lang=L;applyTheme()}
let NR=0,WMN=0,WD=null,WE=0,WM=0,WDEL=0,SD=day(),ND=day(),FS=null,HTF=0,CM=0,SM=null,ST=false,CD=day(),W=S.W||null,tab='hoje',P='w',M='n',RB=null,PK=null,RT=null,HF={f:'d',days:[],t:3,name:'',emoji:''},HT={name:'',date:day()};
fix();
let SAVEERR=0,NOQ=0;
// grava no aparelho; NOQ=1 quando os dados vieram da nuvem (não reenviar)
function writeLocal(){try{localStorage.setItem(K,JSON.stringify(S));SAVEERR=0;return true}catch(e){if(!SAVEERR){SAVEERR=1;try{alert(x('sverr'))}catch(_){}}return false}}
function save(){S.W=W;S._at=Date.now();writeLocal();if(!NOQ&&typeof cloudQ=='function')cloudQ()}
const saveWk=()=>save(),saveN=()=>save();
// pede ao iOS/Android para não apagar o armazenamento desta app
try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist().catch(()=>{})}catch(e){}
if(RECOVERED)writeLocal(); // repõe a cópia recuperada por cima dos dados estragados
if(!FRESH)LBK.snap();
