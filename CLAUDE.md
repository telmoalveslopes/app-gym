# App Gym — regras para o Claude

## Publicação automática (pedido do Telmo, 26-11-2026)
- O ramo `main` do repositório `telmoalveslopes/app-gym` publica sozinho no GitHub Pages:
  https://telmoalveslopes.github.io/app-gym/ (workflow `.github/workflows/pages.yml`, publica a pasta `src/`).
- O Telmo usa a app no iPhone (adicionada ao ecrã principal a partir do Safari). Quer que cada mudança chegue lá sem ter de pedir.
- Por isso: depois de cada alteração à app que esteja terminada e verificada (`npm run check` a passar e, se mexer no ecrã, vista no browser), fazer commit e `git push` para `main` sem perguntar. No fim, dizer que foi publicado e que demora cerca de 1 minuto.
- Não fazer push de trabalho a meio ou com erros. Se o check falhar, corrigir primeiro.
- Quando mudar ficheiros em `src/`, aumentar `VERSION` em `src/sw.js` (ex.: `appgym-v5`). A app recarrega sozinha quando o service worker novo entra (ver o fim de `index.html`).
- Este repositório NÃO é o site do Molhe: a regra do "ok do Paulo" não se aplica aqui.

## Notas técnicas
- Node está em `C:\Program Files\nodejs` (pode não estar no PATH de terminais antigos).
- APK Android: `npm run apk` (ver README). A pasta `android/` não vai para o git.
