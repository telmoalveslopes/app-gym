// Gera icon-192.png / icon-512.png a partir de icon.svg (usa Playwright, só para regenerar ícones)
const {chromium}=require('playwright'),fs=require('fs'),path=require('path');
(async()=>{const b=await chromium.launch(),d=path.join(__dirname,'../src/icons'),svg=fs.readFileSync(d+'/icon.svg','utf8');
for(const z of [192,512]){const p=await b.newPage({viewport:{width:z,height:z}});await p.setContent(`<body style="margin:0">${svg.replace('<svg','<svg width="'+z+'" height="'+z+'"')}</body>`);await p.screenshot({path:`${d}/icon-${z}.png`,omitBackground:true});}
await b.close()})();
