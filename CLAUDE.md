# App Gym — regras para o Claude

## Publicação automática (pedido do Telmo, 26-11-2026)
- O ramo `main` do repositório `telmoalveslopes/app-gym` publica sozinho no GitHub Pages:
  https://telmoalveslopes.github.io/app-gym/ (workflow `.github/workflows/pages.yml`, publica a pasta `src/`).
- O Telmo usa a app no iPhone (adicionada ao ecrã principal a partir do Safari). Quer que cada mudança chegue lá sem ter de pedir.
- Por isso: depois de cada alteração à app que esteja terminada e verificada (`npm run check` a passar e, se mexer no ecrã, vista no browser), fazer commit e `git push` para `main` sem perguntar. No fim, dizer que foi publicado e que demora cerca de 1 minuto.
- Não fazer push de trabalho a meio ou com erros. Se o check falhar, corrigir primeiro.
- Quando mudar ficheiros em `src/`, aumentar `VERSION` em `src/sw.js` (ex.: `appgym-v5`). A app recarrega sozinha quando o service worker novo entra (ver o fim de `index.html`).
- Este repositório NÃO é o site do Molhe: a regra do "ok do Paulo" não se aplica aqui.

## Dados dos utilizadores: NUNCA se podem perder (pedido do Telmo, 26-11-2026)
- Os dados de cada pessoa ficam no aparelho (`localStorage`, chave `appgym1`), com cópia diária, e na nuvem (Supabase: `app_data` + `app_backups`). Ver `docs/ESTADO.md` secção 2.
- Ao mudar o código: `fix()` em `04-state-storage.js` só pode ACRESCENTAR campos. Nunca apagar, renomear ou mudar o significado de campos existentes sem migração que preserve os valores antigos. Se o formato mudar, subir `SV`.
- Nunca mudar a chave `appgym1`, os nomes das tabelas ou o formato da coluna `data` sem migração.
- Antes de publicar qualquer mudança que mexa em dados, armazenamento ou sincronização: `npm run test:cloud` e repetir os testes descritos em `docs/ESTADO.md` secção 5.
- Nunca pôr a chave `service_role` do Supabase no código. Só a chave pública (anon/publishable) vai em `src/config.js`.

## Pasta sempre atualizada (pedido do Telmo, 26-11-2026)
- Tudo o que for feito fica nesta pasta (`C:\App_ginásio`): código, `supabase/schema.sql`, testes e documentação.
- A cada alteração, atualizar `docs/ESTADO.md`: o histórico com a data (dd-mm-aaaa) e, se for preciso, as outras secções. Atualizar também o `README.md` quando mudar a forma de usar ou a estrutura.

## Notas técnicas
- Node está em `C:\Program Files\nodejs` (pode não estar no PATH de terminais antigos).
- APK Android: `npm run apk` (ver README). A pasta `android/` não vai para o git.
