// Cache para funcionar offline. Rede primeiro (sempre a versão mais recente), cache só sem internet.
// Aumenta VERSION quando mudares ficheiros.
const VERSION='appgym-v10',FILES=['./','index.html','style.css','manifest.webmanifest','config.js','vendor/supabase.js'];
self.addEventListener('install',e=>e.waitUntil(caches.open(VERSION).then(c=>c.addAll(FILES.map(f=>new Request(f,{cache:'reload'})))).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==VERSION).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const q=e.request;if(q.method!=='GET'||new URL(q.url).origin!==location.origin)return;
// no-cache: pergunta sempre ao servidor se há versão nova (evita misturar ficheiros antigos e novos)
e.respondWith(fetch(new Request(q.url,{cache:'no-cache'})).then(r=>{if(r.ok){const c=r.clone();caches.open(VERSION).then(x=>x.put(q.url,c))}return r}).catch(()=>caches.match(q.url,{ignoreSearch:true})))});
