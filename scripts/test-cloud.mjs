// Prepara uma cópia da app com uma base de dados FALSA (tests/fake-supabase.js) em .test/ e serve-a em http://localhost:5181
// para testar contas e sincronização sem tocar na base de dados real. Uso: npm run test:cloud
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {spawn} from 'node:child_process';
const r=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),t=path.join(r,'.test');
fs.rmSync(t,{recursive:true,force:true});fs.cpSync(path.join(r,'src'),t,{recursive:true});
fs.copyFileSync(path.join(r,'tests/fake-supabase.js'),path.join(t,'vendor/supabase.js'));
fs.writeFileSync(path.join(t,'config.js'),"window.APPGYM_CLOUD={url:'https://mock.supabase.co',key:'mock'};\n");
console.log('Cópia de teste em .test/ (base de dados falsa em localStorage MOCKDB)');
spawn(process.execPath,[path.join(r,'scripts/serve.mjs'),'5181',t],{stdio:'inherit'});
