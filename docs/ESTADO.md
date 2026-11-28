# App Gym: estado do projeto

> Documento de referência, atualizado a cada alteração. Última atualização: **27-11-2026**.
> Para retomar o trabalho noutra conversa, ler primeiro **[CONTINUAR.md](CONTINUAR.md)**.

## 1. O que é
App de telemóvel que junta **Hábitos** (estilo Upwell), **Treino** (estilo Hevy) e **Nutrição** (estilo Kiwi/FatSecret).
- Endereço (iPhone, Safari → Partilhar → Adicionar ao ecrã principal): https://telmoalveslopes.github.io/app-gym/
- Código: https://github.com/telmoalveslopes/app-gym (público). Cada push para `main` publica sozinho em cerca de 1 minuto.
- Pasta local: `C:\App_ginásio`

## 2. Onde ficam os dados (e porque não se perdem)

| Camada | Onde | Para quê |
|---|---|---|
| 1. Aparelho | `localStorage` do iPhone, chave `appgym1` | Funciona sem rede. Grava a cada alteração. |
| 2. Cópia diária no aparelho | chaves `appgym1_bak_AAAA-MM-DD` (últimos 7 dias) | Recuperar se os dados locais se estragarem. |
| 3. Nuvem (base de dados) | Supabase, tabela `app_data` (uma linha por pessoa) | Dados de cada conta, em qualquer telemóvel. |
| 4. Cópia diária na nuvem | Supabase, tabela `app_backups` (uma por pessoa por dia) | Restaurar um dia anterior (Definições → Conta e nuvem). |
| 5. Exportar | ficheiro `.json` (Definições → Cópia de segurança) | Cópia manual guardada onde quiseres. |
| 6. Personal trainer | Supabase, tabelas `profiles`, `coach_links`, `coach_plans` | Estatuto de cada conta, ligações PT↔aluno e planos do PT (ver secção 2.1). |

**Garantias (testadas a 26-11-2026, com base de dados simulada):**
- Fechar e abrir a app no iPhone: os dados ficam no aparelho e a sessão mantém-se.
- Mudar ou reinstalar o telemóvel: depois de entrar na conta, os dados voltam da nuvem.
- Sem rede: grava no aparelho e envia quando houver ligação.
- Dois telemóveis a mudar ao mesmo tempo: as alterações juntam-se e fica uma cópia do estado anterior.
- Dados locais estragados: não se escreve por cima. Guarda-se o estragado (`appgym1_corrupt_…`), recupera-se a cópia diária e a nuvem tem prioridade.
- Outra pessoa no mesmo telemóvel: cada conta vê só os seus dados (regras RLS no servidor).
- Atualizações da app: `fix()` só acrescenta campos novos e nunca apaga dados. O formato tem versão (`S.v`, atual = 2).
- A app pede ao sistema armazenamento persistente (`navigator.storage.persist`).

### 2.1 Personal trainer e alunos (27-11-2026)
- **Estatutos**: `user` (normal), `coach` (PT), `admin` (tu). Só o admin dá ou tira o estatuto de PT (painel do PT → Admin, ou SQL). Ninguém se promove a si próprio: a tabela `profiles` não aceita escrita direta da app.
- **Ligação**: o PT dá o seu código (Definições → Personal trainer). É o **aluno** que o escreve e aceita; aluno ou PT podem terminar a ligação a qualquer momento, e o PT perde logo o acesso.
- **O que o PT pode**: LER os dados dos seus alunos (treinos, nutrição, hábitos, peso) e escrever um plano numa tabela à parte (`coach_plans`): metas (kcal, macros, peso objetivo), rotinas, hábitos, plano alimentar, pesagens e uma nota. **Nunca** altera nem apaga os dados do aluno; as cópias na nuvem do aluno continuam só dele.
- **Na app do aluno** (campo novo `S.coach`): as metas do PT substituem só os valores que ele preencheu; rotinas e hábitos do PT aparecem com 🧑‍🏫 PT; as pesagens do PT só entram em dias sem registo; a nota aparece no Hoje e o plano alimentar na Nutrição (botão ＋ para registar). Se a ligação terminar, as rotinas e hábitos ficam como normais e o histórico mantém-se.
- **Testado no servidor real a 27-11-2026** com `supabase/test-security.sql`: 34 verificações, todas ok (utilizadores falsos; o teste desfaz tudo no fim).
- **Testado também a 27-11-2026 com a base de dados simulada** (que imita as regras do servidor): conta normal não se consegue promover; admin promove PT e não consegue despromover outro admin; PT sem ligação não lê nem escreve nada do aluno; aluno liga-se com o código; PT lê, envia plano e não consegue escrever nos dados do aluno; outra conta não vê nada e um código errado é recusado; ligar, desligar e voltar a ligar não duplica nada. **Falta experimentar com contas reais no iPhone.**

## 3. Ligar a base de dados (feito a 27-11-2026, passos 1 a 4)
Projeto Supabase `app-gym` (região Central EU, Frankfurt; plano grátis), ref. `zcqfceygctyqsjexangc`. Falta o passo 5 (conta no iPhone) e o 6 (tornar-te admin). Os passos ficam aqui para referência.
1. Criar conta grátis em https://supabase.com e um projeto novo (região: Europe, ex. Frankfurt). Guardar a password da base de dados num sítio seguro.
2. No projeto: **SQL Editor → New query**, colar o conteúdo de `supabase/schema.sql` e carregar em **Run**.
3. **Authentication → URL Configuration**: em *Site URL* pôr `https://telmoalveslopes.github.io/app-gym/`.
4. **Project Settings → API**: copiar o *Project URL* e a chave pública *anon / publishable* e dá-las ao Claude, que as põe em `src/config.js` e publica. **Nunca** dar a chave `service_role`.
5. No iPhone: Definições (⚙️ no Perfil) → Conta e nuvem → **Criar conta** → confirmar o email → **Entrar**. Os dados que já estão no telemóvel sobem para a conta.
6. Tornar-te admin (uma vez, depois do passo 5): no **SQL Editor** correr, com o teu email no lugar de O_TEU_EMAIL:
   `insert into public.profiles (user_id, role) select id, 'admin' from auth.users where email = 'O_TEU_EMAIL' on conflict (user_id) do update set role = 'admin';`
   A partir daí, em Definições → Personal trainer → Abrir, podes dar o estatuto de PT a outras contas. (O email não fica no código, que é público.)

Se a base de dados já existir de antes, basta voltar a correr o `supabase/schema.sql` todo: pode ser corrido várias vezes sem estragar nada e acrescenta as tabelas do PT.

Nota: no plano grátis, um projeto Supabase sem uso durante 7 dias fica em pausa. Os dados não se perdem: basta reativá-lo no site. Com uso diário isto não acontece.

## 4. Estrutura do código
- `src/index.html`: carrega os scripts por ordem (não são módulos ES).
- `src/config.js`: ligação à nuvem (URL + chave pública).
- `src/vendor/supabase.js`: biblioteca Supabase incluída na app (funciona offline). Para atualizar: `npm run vendor`.
- `src/js/04-state-storage.js`: estado `S`, `save()`, cópias diárias locais, recuperação.
- `src/js/20-cloud.js`: contas, sincronização, junção de dados, cópias na nuvem.
- `src/js/21-food-add.js`: adicionar alimento, refeições guardadas, lista de refeições editável.
- `src/js/22-coach.js`: personal trainer (painel do PT, ligação do aluno, aplicação do plano, admin).
- `supabase/schema.sql`: tabelas e regras de segurança.
- `tests/fake-supabase.js` + `npm run test:cloud`: base de dados falsa para testar a sincronização sem tocar na real.
- Restantes ficheiros: ver `README.md`.

## 5. Antes de publicar uma alteração (lista obrigatória)
1. `npm run check` (sintaxe).
2. Abrir a app no browser em tamanho de telemóvel e ver o ecrã alterado, sem erros na consola.
3. Se mexer em dados ou armazenamento: `npm run test:cloud` e repetir os testes de sincronização (nova conta, novo telemóvel, sem rede, conflito, dados estragados, outra conta).
4. Subir `VERSION` em `src/sw.js`.
5. Atualizar este documento (secção 6).
6. Commit e push para `main` (publica sozinho).

## 6. Histórico de alterações
- **28-11-2026 (2)**: Corrigido erro «missing email or phone» ao entrar/criar conta: a proteção contra toques repetidos redesenhava o ecrã antes de ler o email e a password. Agora lê primeiro e mantém os campos preenchidos. Testado com cliques reais na base de dados simulada.
- **28-11-2026**: Conta do Telmo criada; o link de confirmação falhou porque carregou várias vezes em «Criar conta» (cada email novo anula o link do anterior). Conta confirmada à mão no SQL Editor e tornada admin. Na app: «Criar conta»/«Entrar» não aceitam toques repetidos enquanto esperam; botão «Reenviar email de confirmação»; ao voltar de um link inválido aparece um aviso claro; ao voltar de um link bom aparece «Email confirmado» (no iPhone o link abre no Safari, depois entra-se na app do ecrã principal). Aviso: o email do Supabase grátis só envia poucos emails por hora e não deixa mudar o texto sem servidor de email (SMTP) próprio.
- **27-11-2026**: Base de dados Supabase ligada: projeto `app-gym` criado (Frankfurt, plano grátis), `schema.sql` corrido, Site URL configurado, chave pública em `src/config.js`. Novo `supabase/test-security.sql` (34 verificações de segurança no servidor real, todas ok).
- **27-11-2026**: Personal trainer: estatutos (utilizador, PT, admin), ligação aluno→PT por código, painel do PT com o progresso de cada aluno (treinos, calorias e proteína vs meta, hábitos, peso) e editor de plano (metas, peso objetivo, pesagens, rotinas, hábitos, plano alimentar, nota). Regras de segurança novas em `supabase/schema.sql`. Base de dados simulada (`tests/fake-supabase.js`) passou a imitar estas regras. Testes de sincronização repetidos.
- **27-11-2026**: Treino: kg antes das reps; uma série só fica feita com peso (pode ser 0) e reps preenchidos (os campos em falta ficam a vermelho); a linha da série feita fica toda a verde; o menu do tipo de série mostra o atual (Normal por defeito). Unidades nas Definições (kg/lb, km/mi, cm/in, ml/fl oz), os dados continuam guardados em métrico. Hábitos: o dia de hoje aparece como "Hoje". Nutrição: refeições com nomes à escolha, ordem, acrescentar e esconder (padrão: Pequeno-almoço, Almoço, Lanche, Jantar; campo novo `S.meals`); refeições personalizadas (`S.cmeals`, também "💾 Guardar como refeição"); ecrã de adicionar alimento abre em Recentes (dias anteriores dessa refeição, alimentos recentes com a última quantidade, botão ＋ rápido), com separadores Refeições e Os meus, e a pesquisa passa a ser um passo à parte; novo ecrã de quantidade (gráfico de macros, botões −/+). Exercícios: de ~210 para 564. Testado com a base de dados simulada: conta nova, telemóvel novo, conta antiga sem os campos novos, conflito entre dois aparelhos.
- **26-11-2026**: Base de dados na nuvem (Supabase) com contas, sincronização automática, cópias diárias no aparelho e na nuvem, recuperação de dados estragados, armazenamento persistente e testes com base de dados simulada. Corrigido o texto das metas, que mostrava "Nota".
- **26-11-2026**: Novo visual (cor por área, abas reorganizadas, separadores no Perfil).
- **26-11-2026**: Supersets, notas por exercício, pesquisa online de alimentos (Open Food Facts e USDA).
- **26-11-2026**: Correções (temporizador, séries vazias, confirmações), histórico por exercício, peso corporal, alimentos recentes, copiar refeição, calorias de 7 dias, exportar/importar.
- **26-11-2026**: Publicação no GitHub Pages para iPhone; APK Android de teste.
