// Servidor estático sem dependências: node scripts/serve.mjs [porta]
import http from 'node:http';import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..',process.argv[3]||'src'),port=+process.argv[2]||5173;
const T={'.html':'text/html;charset=utf-8','.js':'text/javascript;charset=utf-8','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webmanifest':'application/manifest+json'};
http.createServer((q,s)=>{let p=path.join(root,decodeURIComponent(q.url.split('?')[0]));if(!p.startsWith(root)){s.writeHead(403);return s.end()}
if(fs.existsSync(p)&&fs.statSync(p).isDirectory())p=path.join(p,'index.html');
fs.readFile(p,(e,d)=>{if(e){s.writeHead(404);return s.end('404')}s.writeHead(200,{'Content-Type':T[path.extname(p)]||'application/octet-stream','Cache-Control':'no-store'});s.end(d)})
}).listen(port,()=>console.log(`App Gym em http://localhost:${port}  (abre no telemóvel com o IP do PC, mesma Wi-Fi)`));
