# Continuar noutra conversa

> Ler isto primeiro. Ponto de situação em **26-11-2026** (fim do dia).

## Como começar
1. Abrir uma conversa nova com a pasta `C:\App_ginásio`.
2. Dizer, por exemplo: *"Lê o docs/CONTINUAR.md e o docs/ESTADO.md e continuamos."*
3. O `CLAUDE.md` desta pasta tem as regras (publicação automática, os dados nunca se perdem, manter a documentação em dia), e o Claude lê-o sozinho.

## Onde está tudo
| O quê | Onde |
|---|---|
| App no iPhone | https://telmoalveslopes.github.io/app-gym/ (Safari → Partilhar → Adicionar ao ecrã principal) |
| Código (GitHub, público) | https://github.com/telmoalveslopes/app-gym (ramo `main` publica sozinho) |
| Pasta local | `C:\App_ginásio` |
| Estado completo e histórico | `docs/ESTADO.md` |
| Regras para o Claude | `CLAUDE.md` |
| Base de dados (estrutura) | `supabase/schema.sql` |
| Ligação à base de dados | `src/config.js` (ainda vazio) |
| APK Android de teste | `AppGym-debug.apk` (gera-se com `npm run apk`; não vai para o GitHub) |

## Feito até hoje
- App completa: Hoje, Hábitos, Treino (rotinas, supersets, notas, histórico por exercício, PRs), Nutrição (refeições, água, macros, micronutrientes, pesquisa online Open Food Facts/USDA, código de barras), Perfil (separadores, calendário, peso).
- Novo visual com uma cor por área.
- Proteção dos dados no aparelho: cópia diária, recuperação de dados estragados, armazenamento persistente.
- Código da base de dados na nuvem com contas, pronto e testado com uma base de dados simulada (`npm run test:cloud`).

## PRÓXIMO PASSO (pendente do Telmo)
**Ligar a base de dados Supabase.** Sem isto, os dados ficam só no iPhone.
1. Criar conta grátis em https://supabase.com e um projeto novo (região Europe).
2. SQL Editor → New query → colar `supabase/schema.sql` → Run.
3. Authentication → URL Configuration → *Site URL* = `https://telmoalveslopes.github.io/app-gym/`
4. Project Settings → API → dar ao Claude o **Project URL** e a chave **anon / publishable** (NUNCA a `service_role`).
5. O Claude põe os valores em `src/config.js`, testa com a base de dados real e publica.
6. No iPhone: ⚙️ (Perfil) → Conta e nuvem → Criar conta → confirmar email → Entrar.

## Ideias para depois (não pedidas ainda)
- Lembretes/notificações de hábitos e treino.
- Chave USDA própria (a atual é pública, com limite de ~30 pesquisas/hora).
- Melhorar a ordem dos resultados da pesquisa USDA (aparecem primeiro os processados).
- Testar o leitor de código de barras num iPhone real.

## Notas técnicas rápidas
- Node: `C:\Program Files\nodejs` (abrir um terminal novo se `node` não for reconhecido).
- Correr no PC: `npm run dev` → http://localhost:5173
- Antes de publicar: `npm run check`; se mexer em dados: `npm run test:cloud`; subir `VERSION` em `src/sw.js`; atualizar `docs/ESTADO.md`.
- O PowerShell 5.1 estraga acentos ao gravar ficheiros: usar as ferramentas de edição ou o Bash, não `Set-Content`.
