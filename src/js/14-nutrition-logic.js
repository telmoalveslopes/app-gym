const fInfo=n=>S.cfoods.find(f=>f.n===n)||FM.get(n);
function tot(d){const t=Array(NU.length).fill(0),lg=S.nlog[d]||{};Object.keys(lg).forEach(m=>Array.isArray(lg[m])&&lg[m].forEach(e=>{const f=fInfo(e.n);if(f)f.v.forEach((v,i)=>t[i]+=v*e.g/100)}));return t}
function calc(){const s=S.set,m=s.sex!='f',w=+s.w||70,h=+s.h||170,a=+s.age||30,bmr=10*w+6.25*h-5*a+(m?5:-161),tdee=bmr*(+s.act||1.2),f={cut:.8,mcut:.9,maint:1,lean:1.1,bulk:1.15}[s.goal]||1,k=Math.round(tdee*f/10)*10,pk={cut:2.2,mcut:2,maint:1.8,lean:1.8,bulk:1.8}[s.goal]||1.8,P=Math.round(pk*w),F=Math.round(Math.max(k*.25/9,.7*w)),C=Math.max(0,Math.round((k-4*P-9*F)/4));return{bmr:Math.round(bmr),tdee:Math.round(tdee),k,P,C,F,Fi:Math.max(25,Math.round(14*k/1000))}}
// metas do PT (se houver) substituem só os valores que ele preencheu
const goal=()=>{const g=goal0(),cg=typeof coachG=='function'&&coachG();return cg?['gk','gp','gc','gf','gfi'].map((k,i)=>+cg[k]>0?+cg[k]:g[i]):g};
const goal0=()=>{const s=S.set;if(s.mode=='custom')return[+s.gk||0,+s.gp||0,+s.gc||0,+s.gf||0,+s.gfi||0];const c=calc();return[c.k,c.P,c.C,c.F,c.Fi]};
function TG(){const s=S.set,m=s.sex!='f',a=+s.age||30,w=+s.w||70,g=goal(),k=g[0],t=NU.map(()=>0);
t[0]=g[0];t[1]=g[1];t[2]=g[2];t[3]=g[3];t[4]=g[4];t[5]=50;t[6]=k*.1/9;t[7]=300;t[8]=2300;
t[9]=m?900:700;t[10]=m?90:75;t[11]=a>70?20:15;t[12]=15;t[13]=m?120:90;t[14]=m?1.2:1.1;t[15]=m?1.3:1.1;t[16]=m?16:14;t[17]=a>50?(m?1.7:1.5):1.3;t[18]=400;t[19]=2.4;
t[20]=(a>70||(!m&&a>50))?1200:1000;t[21]=(!m&&a<=50)?18:8;t[22]=a>30?(m?420:320):(m?400:310);t[23]=700;t[24]=m?3400:2600;t[25]=m?11:8;t[26]=55;
t[29]=k*.01/9;t[30]=m?1.6:1.1;t[31]=a>50?(m?14:11):(m?17:12);t[32]=w*35;t[33]=20;t[34]=400;t[35]=5;t[36]=m?550:425;t[37]=.9;t[38]=m?2.3:1.8;t[39]=150;
[10,20,39,30,15,25,15,4,26].forEach((v,i)=>t[40+i]=v*w/1000);t[51]=k*.1/4;t[67]=30;t[69]=m?4000:3000;t[70]=a>50?(m?30:20):(m?35:25);t[71]=45;return t}
const target=i=>TG()[i],pct=(t,i)=>target(i)?t[i]/target(i)*100:0,r1=v=>v>=100?Math.round(v):Math.round(v*10)/10;
// openFD, drawFD, listFD, selF, pvF, addF: ver 21-food-add.js
function mkF(){const m=FS.mk;return `<div class="card"><h2>${x('nm')}</h2><input value="${esc(m.n)}" oninput="FS.mk.n=this.value"><h2 style="margin-top:12px">${x('p100')}</h2>${[['kcal',0],['P (g)',1],['C (g)',2],['F (g)',3],[x('fibl'),4]].map(([l,i])=>`<div class="row"><span class="grow">${l}</span><input type="number" inputmode="decimal" style="width:100px" value="${m.v[i]}" oninput="FS.mk.v[${i}]=this.value"></div>`).join('')}<button class="btn full" onclick="saveF()">${x('sv')}</button><button class="btn red full" onclick="FS.mk=null;drawFD()">${x('cn')}</button></div>`}
function saveF(){const m=FS.mk,n=m.n.trim();if(!n||FM.has(n)||S.cfoods.some(f=>f.n===n))return;const v=Array(NU.length).fill(0);m.v.forEach((y,i)=>v[i]=+y||0);S.cfoods.push({n,c:'★',u:100,v});if(m.bc)S.barcodes[m.bc]=n;FS.mk=null;FS.sel=n;FS.g=100;save();drawFD()}
const UL={9:3000,10:2000,11:100,12:1000,16:35,17:100,18:1000,20:2500,21:45,23:4000,25:40,26:400,36:3500,37:10,38:11,39:1100};
