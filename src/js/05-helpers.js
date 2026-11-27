const back=n=>{const d=new Date();d.setDate(d.getDate()-n);return day(d)};
const dow=d=>(new Date(d+'T12:00').getDay()+6)%7;
const wdays=(d=day())=>{const o=Math.round((new Date(day()+'T12:00')-new Date(d+'T12:00'))/864e5)+dow(d);return[0,1,2,3,4,5,6].map(i=>back(o-i))};
const mdaysO=(o=0)=>{const n=new Date(),y=n.getFullYear(),m=n.getMonth()+o,c=new Date(y,m+1,0).getDate();return Array.from({length:c},(_,i)=>day(new Date(y,m,i+1)))},mdays=()=>mdaysO(0);
const fd=d=>d.slice(8)+'/'+d.slice(5,7);
const wml=d=>((S.nlog[d]||{}).w||[]).reduce((a,e)=>a+(+e.g||0),0),wgoal=()=>Math.round(TG()[32]/250)*250||2000,wok=d=>wml(d)>=wgoal();
const hdone=(h,d)=>h.auto?!!(h.done[d]||S.workouts.some(w=>w.date===d)):h.aw?!!(h.done[d]||wok(d)):!!h.done[d];
const streak=h=>{let n=0,i=hdone(h,back(0))?0:1;while(i<400&&hdone(h,back(i))){n++;i++}return n};
const wk=(h,d)=>wdays(d).filter(y=>y<=d&&hdone(h,y)).length;
const due=(h,d)=>h.f!=='w'||(h.days&&h.days.length?h.days.includes(dow(d)):(hdone(h,d)||wk(h,d)<h.t));
const exInfo=n=>S.custom.find(c=>c.n===n)||EXM.get(n)||{n,g:'Cardio e corpo inteiro',t:'wr'};
const mmss=s=>Math.floor(s/60)+':'+String(s%60).padStart(2,'0');
const parseT=v=>{v=String(v).trim();if(!v)return'';if(v.includes(':')){const a=v.split(':').map(Number);return a.length==3?a[0]*3600+a[1]*60+a[2]:a[0]*60+(a[1]||0)}return+v||''};
// --- unidades: os dados ficam SEMPRE em métrico (kg, km, m, cm, ml); só o que se mostra e se escreve muda ---
const UF=()=>({w:S.set.uw=='lb'?2.20462262:1,d:S.set.ud=='mi'?0.621371192:1,m:S.set.ud=='mi'?3.2808399:1,h:S.set.uh=='in'?1/2.54:1,v:S.set.uv=='oz'?1/29.5735296:1});
const U={w:()=>S.set.uw=='lb'?'lb':'kg',d:()=>S.set.ud=='mi'?'mi':'km',m:()=>S.set.ud=='mi'?'ft':'m',h:()=>S.set.uh=='in'?'in':'cm',v:()=>S.set.uv=='oz'?'fl oz':'ml'};
const uIn=(q,v)=>v===''||v==null?'':Math.round(+v*UF()[q]*10)/10; // métrico -> unidade escolhida
const uOut=(q,v)=>{v=String(v??'').trim().replace(',','.');return v===''||isNaN(+v)?'':Math.round(+v/UF()[q]*1e4)/1e4}; // unidade escolhida -> métrico
const fu=(q,v)=>uIn(q,+v||0)+' '+U[q](),fvol=v=>Math.round(uIn('w',v||0))+' '+U.w();
const kq=(t,k)=>k=='kg'?'w':k=='dist'?(t=='dd'?'d':'m'):null;
// uma série só pode ser dada como feita com todos os campos preenchidos (peso pode ser 0; reps, tempo e distância maiores que 0)
const fOK=(k,v)=>v!==''&&v!=null&&!isNaN(+v)&&(k=='kg'?+v>=0:+v>0),setOK=(t,s)=>FT[t].every(k=>fOK(k,s[k]));
const pfmt=(ty,s)=>(s.ty&&s.ty!='n'?s.ty.toUpperCase()+' ':'')+FT[ty].map(k=>k=='reps'?s.reps||0:k=='time'?mmss(s.time||0):k=='dist'?uIn(kq(ty,k),s.dist||0)+U[kq(ty,k)]():(ty=='wb'?'+':ty=='ab'?'−':'')+uIn('w',s.kg||0)+U.w()).join('×');
const lab=(ty,k)=>k=='reps'?'Reps':k=='time'?x('tm'):k=='dist'?U[kq(ty,k)]():(ty=='wb'?'+':ty=='ab'?'−':'')+U.w();
const prev=n=>{for(let i=S.workouts.length-1;i>=0;i--){const e=S.workouts[i].ex.find(y=>y.name===n);if(e)return e.sets}return[]};
const vol=w=>w.ex.reduce((a,e)=>{const t=e.t||exInfo(e.name).t;return a+(t=='wr'||t=='wb'?e.sets.reduce((b,s)=>b+(s.ty=='w'?0:(+s.kg||0)*(+s.reps||0)),0):0)},0);
const blank=()=>({reps:'',kg:'',time:'',dist:'',ok:0,ty:'n'});
const newEx=(n,c,r)=>({name:n,t:exInfo(n).t,rest:r??S.exRest[n]??S.set.rest,sets:Array.from({length:c||1},()=>blank())});
// supersets: e.lk = ligado ao exercício seguinte. ssStart = início do grupo; ssL = letra do grupo (A, B…) ou ''
const ssStart=(a,i)=>{while(i>0&&a[i-1].lk)i--;return i};
const ssL=a=>{const o=[];let g=-1;a.forEach((e,i)=>{const inG=e.lk||(i>0&&a[i-1].lk);if(inG&&!(i>0&&a[i-1].lk))g++;o.push(inG?String.fromCharCode(65+g):'')});return o};
const ssTag=l=>l?`<span class="pill" style="background:var(--ac);color:var(--on)">🔗 ${x('ssup')} ${l}</span>`:'';
const lastNote=n=>{for(let i=S.workouts.length-1;i>=0;i--){const e=S.workouts[i].ex.find(y=>y.name===n&&y.note);if(e)return e.note}return''};
