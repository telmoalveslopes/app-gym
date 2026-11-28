# Continuar noutra conversa

> Ler isto primeiro. Ponto de situação em **27-11-2026**.

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
| Base de dados (Supabase) | projeto `app-gym`, região Frankfurt, plano grátis: https://supabase.com/dashboard/project/zcqfceygctyqsjexangc (entrar com o GitHub) |
| Ligação à base de dados | `src/config.js` (URL e chave pública já postos) |
| Teste de segurança no servidor | `supabase/test-security.sql` (correr no SQL Editor; 34 linhas "ok") |
| APK Android de teste | `AppGym-debug.apk` (gera-se com `npm run apk`; não vai para o GitHub) |

## Feito até hoje
- App completa: Hoje, Hábitos, Treino (rotinas, supersets, notas, histórico por exercício, PRs), Nutrição (refeições, água, macros, micronutrientes, pesquisa online Open Food Facts/USDA, código de barras), Perfil (separadores, calendário, peso).
- Novo visual com uma cor por área.
- Proteção dos dados no aparelho: cópia diária, recuperação de dados estragados, armazenamento persistente.
- Código da base de dados na nuvem com contas, pronto e testado com uma base de dados simulada (`npm run test:cloud`).
- 27-11: treino (kg antes das reps, séries só válidas com peso e reps, linha verde), unidades kg/lb etc., "Hoje" nos hábitos, refeições com nomes à escolha e personalizadas, novo ecrã de adicionar alimento (recentes primeiro), 564 exercícios.
- 27-11: **personal trainer** (estatutos, ligação aluno→PT por código, painel com o progresso dos alunos, plano com metas/rotinas/hábitos/refeições/pesagens/nota, admin). Ver `docs/ESTADO.md` secção 2.1.
- 28-11: confirmação de email mais robusta (sem toques repetidos, botão reenviar, aviso de link inválido). O Supabase grátis envia poucos emails por hora: se vierem muitos alunos de uma vez, ligar um SMTP próprio (ex.: Resend ou Brevo).
- 27-11: **base de dados Supabase ligada** (projeto criado, `schema.sql` corrido, Site URL configurado, chave pública em `src/config.js`). As 34 regras de segurança testadas no servidor real com `supabase/test-security.sql`: todas ok, e o teste não deixa nada gravado.

## PRÓXIMO PASSO (pendente do Telmo)
1. ~~Criar conta~~ e ~~tornar admin~~: feito a 28-11 (conta confirmada à mão no SQL Editor, perfil `admin`).
2. No iPhone: ⚙️ (Perfil) → Conta e nuvem → **Entrar** com o email e a password. Os dados do telemóvel sobem para a conta.
3. Depois: confirmar no iPhone que aparece "Guardado na nuvem" e experimentar o personal trainer (Definições → Personal trainer).

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
