// Gera o APK de teste (Android): src -> www -> android -> AppGym-debug.apk na raiz.
// Usa o Java que vem com o Android Studio se JAVA_HOME não estiver definido.
import fs from 'node:fs';import path from 'node:path';import {execSync} from 'node:child_process';import {fileURLToPath} from 'node:url';
const r=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),win=process.platform==='win32';
const jbr=win?'C:\\Program Files\\Android\\Android Studio\\jbr':'/Applications/Android Studio.app/Contents/jbr/Contents/Home';
const env={...process.env};if(!env.JAVA_HOME&&fs.existsSync(jbr))env.JAVA_HOME=jbr;
const run=(c,cwd=r)=>execSync(c,{cwd,env,stdio:'inherit'});
run('node scripts/build.mjs');run('npx cap sync android');
const and=path.join(r,'android');
run(win?`"${path.join(and,'gradlew.bat')}" assembleDebug`:'./gradlew assembleDebug',and);
fs.copyFileSync(path.join(r,'android/app/build/outputs/apk/debug/app-debug.apk'),path.join(r,'AppGym-debug.apk'));
console.log('APK pronto: AppGym-debug.apk');
