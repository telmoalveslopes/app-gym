// Copia src/ para www/ (pasta que o Capacitor empacota). Sem dependências.
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const r=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
fs.rmSync(path.join(r,'www'),{recursive:true,force:true});fs.cpSync(path.join(r,'src'),path.join(r,'www'),{recursive:true});
console.log('www/ pronto');
