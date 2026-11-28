# Continuar noutra conversa

> Ler isto primeiro. Ponto de situação em **28-11-2026**. Tudo o que está em "Feito" está **terminado, publicado e a funcionar**.

## Como começar
1. Abrir uma conversa nova com a pasta `C:\App_ginásio`.
2. Dizer, por exemplo: *"Lê o docs/CONTINUAR.md e o docs/ESTADO.md e continuamos."*
3. O `CLAUDE.md` desta pasta tem as regras (publicação automática, os dados nunca se perdem, manter a documentação em dia), e o Claude lê-o sozinho.

## Onde está tudo
| O quê | Onde |
|---|---|
| App no iPhone | https://telmoalveslopes.github.io/app-gym/ (Safari → Partilhar → Adicionar ao ecrã principal) |
| Código (GitHub, público) | https://github.com/telmoalveslopes/app-gym (ramo `main` publica sozinho, cerca de 1 minuto) |
| Pasta local | `C:\App_ginásio` |
| Estado completo e histórico | `docs/ESTADO.md` |
| Regras para o Claude | `CLAUDE.md` |
| Base de dados (estrutura) | `supabase/schema.sql` |
| Base de dados (Supabase) | projeto `app-gym`, ref. `zcqfceygctyqsjexangc`, Frankfurt, plano grátis: https://supabase.com/dashboard/project/zcqfceygctyqsjexangc (o Telmo entra com o GitHub) |
| Ligação à base de dados | `src/config.js` (URL e chave pública; NUNCA a `service_role`) |
| Teste de segurança no servidor | `supabase/test-security.sql` (colar no SQL Editor e correr; as 34 linhas devem dizer "ok"; não grava nada) |
| APK Android de teste | `AppGym-debug.apk` (gera-se com `npm run apk`; não vai para o GitHub) |

## Feito (terminado e publicado)
- **App completa:**
  - Hoje.
  - Hábitos (com o dia de hoje assinalado).
  - Treino: rotinas, supersets, notas, histórico por exercício, PRs e 564 exercícios. O kg vem antes das reps e a série só é válida com peso (0 conta) e reps; quando fica feita, a linha inteira fica verde.
  - Nutrição:
    - refeições com nomes à escolha, mais refeições personalizadas;
    - adicionar alimento abre primeiro nos recentes e nas refeições dos dias anteriores, e a pesquisa vem depois;
    - água, macros e micronutrientes;
    - pesquisa no Open Food Facts e no USDA;
    - código de barras.
  - Perfil: separadores, calendário, peso e unidades (kg/lb e outras) para a app toda.
- **Os dados nunca se perdem:**
  - No aparelho (`localStorage` `appgym1`): cópia diária e recuperação de dados estragados.
  - Na nuvem (Supabase, uma conta por pessoa): `app_data` com cópia diária em `app_backups`. Quando o mesmo dado muda em dois aparelhos, as versões juntam-se.
- **Personal trainer:**
  - Estatutos user/coach/admin. Só o admin dá o estatuto de PT.
  - O aluno liga-se ao PT com o código do PT e pode terminar a ligação.
  - O PT vê o progresso dos alunos e define metas, rotinas, hábitos, refeições, pesagens e uma nota.
  - O PT só lê os dados do aluno, não os altera.
  - Regras de segurança (RLS) testadas no servidor real: 34 de 34 ok.
- **Base de dados ligada (27-11):** projeto criado, `schema.sql` corrido, Site URL = `https://telmoalveslopes.github.io/app-gym/`.
- **Conta do Telmo (28-11):**
  - Criada, confirmada à mão no SQL Editor, perfil `admin`.
  - Entrou no iPhone.
  - Verificado no servidor: dados do iPhone guardados e 1 cópia diária.
- **Contas (28-11):**
  - Os botões não aceitam toques repetidos.
  - Botão "Reenviar email de confirmação".
  - Aviso claro quando o link do email já não serve.
  - "Email confirmado" quando o link funciona.
  - Corrigido o erro "missing email or phone".

## Próximos passos possíveis (nada pendente obrigatório)
1. **Experimentar o personal trainer com uma segunda conta real.** O Telmo, como admin, já tem painel e código de PT. Também pode dar o estatuto de PT a outra pessoa em Definições → Personal trainer.
2. **Email próprio (SMTP), se vierem muitos alunos.** O envio grátis do Supabase manda poucos emails por hora e não deixa mudar o texto. Exemplos: Resend ou Brevo (grátis). Com SMTP próprio, o email pode trazer um código para escrever na app, em vez do link (no iPhone o link abre no Safari e não na app do ecrã principal).
3. Lembretes/notificações de hábitos e treino.
4. Chave USDA própria (a atual é pública, com limite de cerca de 30 pesquisas por hora).
5. Melhorar a ordem dos resultados da pesquisa USDA (aparecem primeiro os processados).
6. Testar o leitor de código de barras num iPhone real.

## Se um aluno não conseguir confirmar a conta
1. Pedir-lhe que carregue em "Reenviar email de confirmação" e abra só o email mais recente.
2. Em último caso, confirmar à mão no SQL Editor:
   `update auth.users set email_confirmed_at = now() where email = '<email>' and email_confirmed_at is null;`

## Notas técnicas rápidas
- Node: `C:\Program Files\nodejs` (abrir um terminal novo se `node` não for reconhecido).
- Correr no PC: `npm run dev` → http://localhost:5173 (liga-se à base de dados real).
- `npm run test:cloud` não termina sozinho: serve uma cópia da app com uma base de dados FALSA em http://localhost:5181, e os testes fazem-se no browser.
- Testar os ecrãs com cliques e texto escritos a sério, não só com chamadas de código. O erro "missing email or phone" só aparecia assim.
- Antes de publicar: `npm run check`; se mexer em dados: `npm run test:cloud`; subir `VERSION` em `src/sw.js` (agora `appgym-v12`); atualizar `docs/ESTADO.md`.
- O PowerShell 5.1 estraga acentos ao gravar ficheiros: usar as ferramentas de edição ou o Bash, não `Set-Content`.
- SQL Editor do Supabase: escrever o SQL numa só linha (o Enter aceita a sugestão do editor). Às vezes o painel diz "Unable to reach the server": basta recarregar a página.
