# App Gym

Hábitos (estilo Upwell) + Treino (estilo Hevy) + Nutrição (estilo Cronometer/Kiwi) numa só app.
Protótipo funcional em JavaScript puro (sem frameworks), pronto para correr no browser e empacotar como app Android/iOS com Capacitor.

## Correr no computador (sem instalar nada)
```
npm run dev        # ou: node scripts/serve.mjs
```
Abre http://localhost:5173. Para testar no telemóvel: mesma Wi-Fi, abre `http://IP-DO-PC:5173` (a câmara/código de barras só funciona em HTTPS ou localhost).

## iPhone (web app, atualiza sozinha)
A app está em https://telmoalveslopes.github.io/app-gym/ e é publicada a cada push para `main` (GitHub Actions → Pages).
No iPhone: abrir esse link no **Safari** → botão Partilhar → **Adicionar ao ecrã principal**. Os dados ficam no iPhone.
Depois de uma publicação, fechar e voltar a abrir a app para carregar a versão nova.

## Transformar em app de telemóvel (Capacitor)
```
npm install
npm run cap:add:android     # precisa de Android Studio
npm run cap:add:ios         # precisa de macOS + Xcode
npm run android             # build + sync + abre no Android Studio
npm run ios
```
### APK de teste (Android) num só comando
```
npm run apk                 # gera AppGym-debug.apk na raiz do projeto
```
Copia o `.apk` para o telemóvel (cabo, Drive, WhatsApp…) e instala-o (é preciso aceitar "instalar apps desconhecidas").
Notas deste PC (Windows):
- A pasta tem um acento (`App_ginásio`), e o Gradle recusa isso por defeito. Por isso está `android.overridePathCheck=true` em `android/gradle.properties`.
- `android/app/src/main/AndroidManifest.xml` tem a permissão `CAMERA` (para o código de barras).
- Se apagares e voltares a criar a pasta `android/`, repõe essas duas alterações.

Os ícones/splash definitivos: `npx @capacitor/assets generate` (usa `src/icons/icon.svg`).

## Estrutura
```
src/
  index.html          casca HTML + lista ordenada de scripts
  style.css           todo o CSS (temas por variáveis --bg --card --ac ...)
  sw.js, manifest.webmanifest   PWA (offline / instalar no ecrã inicial)
  js/                 scripts carregados POR ORDEM (partilham o mesmo scope global)
    00-core            helpers $, esc, norm
    01-i18n            textos PT/EN (D), nomes de exercícios EN (ENS), categorias
    02-theme           7 temas
    03-exercises       LIB (exercícios por grupo muscular), tipos (reps/kg, tempo, distância...)
    04-state-storage   estado S, save() (localStorage), initDB() (opcional, só no artifact do Claude)
    05-helpers         datas, hábitos (streak, due), previous, volume
    06-actions         objeto A: todas as ações (hábitos, tarefas, treino, rotinas)
    07-timer-picker    temporizador de descanso + seletor de exercícios
    08-views-today-habits   ecrãs Hoje e Hábitos
    09-views-workout   Treino, logger, construtor de rotinas, detalhe, histórico
    10-settings        definições (⚙️)
    11-icons-ui        ícones e anéis
    12-nutrients-data  NU: 81 nutrientes (nome PT/EN, unidade, grupo)
    13-foods-data      base de alimentos (FDB, FDB2, FDB3, FXS) e estimativas
    14-nutrition-logic TDEE (Mifflin-St Jeor), metas, RDA por sexo/idade/peso, totais
    15-nutrition-view  ecrã Nutrição, relatório, anéis, calculadora
    16-barcode         leitor de código de barras + Open Food Facts
    17-profile         ecrã Perfil, estatísticas, calendário
    99-main            render R() e arranque
scripts/  serve.mjs (dev), build.mjs (src -> www), check.mjs (sintaxe), icons.cjs
```
Dados: ficam em `localStorage` (chave `appgym1`). Os ficheiros `js/` NÃO são módulos ES — a ordem no `index.html` importa.

## O que falta para uma app "a sério" (próximos passos sugeridos)
1. **Base de dados de alimentos fiável**: os valores atuais são aproximados (muitos escritos de memória, marcados `~`); aminoácidos e alguns micronutrientes são estimados. Substituir por USDA FoodData Central, tabela portuguesa INSA (TCAP) e Open Food Facts (via um pequeno servidor/API ou SQLite local). Marcas/sabores (Prozis, Way Up, Continente…) só com rótulos verificados.
2. **Armazenamento**: trocar localStorage por SQLite (`@capacitor-community/sqlite`) ou backend (Supabase/Firebase) com contas; exportar/importar JSON como backup. Os pontos a mexer são `save()`, `saveWk()`, `saveN()` e `initDB()` em `04-state-storage.js`.
3. **Código de barras**: no telemóvel usar um plugin nativo (ex. `@capacitor-mlkit/barcode-scanning`) em vez de `BarcodeDetector` (`16-barcode.js`).
4. **Migrar para módulos/framework** quando fizer sentido (Vite + ES modules, ou React/Svelte): o código está separado por área para facilitar.
5. Testes automáticos, notificações (lembretes de hábitos), sincronização entre dispositivos.
