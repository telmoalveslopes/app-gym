// Verifica sintaxe de cada ficheiro JS e que o index.html referencia todos.
import fs from 'node:fs';import path from 'node:path';import {execFileSync} from 'node:child_process';import {fileURLToPath} from 'node:url';
const d=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..','src'),js=fs.readdirSync(d+'/js').filter(f=>f.endsWith('.js')).sort(),html=fs.readFileSync(d+'/index.html','utf8');
let bad=0;for(const f of js){try{execFileSync('node',['--check',d+'/js/'+f],{stdio:'pipe'})}catch(e){bad++;console.error('ERRO',f,String(e.stderr).split('\n').slice(0,4).join('\n'))}
if(!html.includes(`js/${f}`)){bad++;console.error('não referenciado no index.html:',f)}}
console.log(bad?'FALHOU':`OK (${js.length} ficheiros)`);process.exit(bad?1:0);
