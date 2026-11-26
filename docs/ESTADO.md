# App Gym: estado do projeto

> Documento de referência, atualizado a cada alteração. Última atualização: **26-11-2026**.

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

**Garantias (testadas a 26-11-2026, com base de dados simulada):**
- Fechar e abrir a app no iPhone: os dados ficam no aparelho e a sessão mantém-se.
- Mudar ou reinstalar o telemóvel: depois de entrar na conta, os dados voltam da nuvem.
- Sem rede: grava no aparelho e envia quando houver ligação.
- Dois telemóveis a mudar ao mesmo tempo: as alterações juntam-se e fica uma cópia do estado anterior.
- Dados locais estragados: não se escreve por cima. Guarda-se o estragado (`appgym1_corrupt_…`), recupera-se a cópia diária e a nuvem tem prioridade.
- Outra pessoa no mesmo telemóvel: cada conta vê só os seus dados (regras RLS no servidor).
- Atualizações da app: `fix()` só acrescenta campos novos e nunca apaga dados. O formato tem versão (`S.v`, atual = 2).
- A app pede ao sistema armazenamento persistente (`navigator.storage.persist`).

## 3. Ligar a base de dados (falta fazer, uma vez)
Enquanto não estiver ligada, a app funciona e guarda no aparelho, com cópia diária, mas não há nuvem.
1. Criar conta grátis em https://supabase.com e um projeto novo (região: Europe, ex. Frankfurt). Guardar a password da base de dados num sítio seguro.
2. No projeto: **SQL Editor → New query**, colar o conteúdo de `supabase/schema.sql` e carregar em **Run**.
3. **Authentication → URL Configuration**: em *Site URL* pôr `https://telmoalveslopes.github.io/app-gym/`.
4. **Project Settings → API**: copiar o *Project URL* e a chave pública *anon / publishable* e dá-las ao Claude, que as põe em `src/config.js` e publica. **Nunca** dar a chave `service_role`.
5. No iPhone: Definições (⚙️ no Perfil) → Conta e nuvem → **Criar conta** → confirmar o email → **Entrar**. Os dados que já estão no telemóvel sobem para a conta.

Nota: no plano grátis, um projeto Supabase sem uso durante 7 dias fica em pausa. Os dados não se perdem: basta reativá-lo no site. Com uso diário isto não acontece.

## 4. Estrutura do código
- `src/index.html`: carrega os scripts por ordem (não são módulos ES).
- `src/config.js`: ligação à nuvem (URL + chave pública).
- `src/vendor/supabase.js`: biblioteca Supabase incluída na app (funciona offline). Para atualizar: `npm run vendor`.
- `src/js/04-state-storage.js`: estado `S`, `save()`, cópias diárias locais, recuperação.
- `src/js/20-cloud.js`: contas, sincronização, junção de dados, cópias na nuvem.
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
- **26-11-2026**: Base de dados na nuvem (Supabase) com contas, sincronização automática, cópias diárias no aparelho e na nuvem, recuperação de dados estragados, armazenamento persistente e testes com base de dados simulada. Corrigido o texto das metas, que mostrava "Nota".
- **26-11-2026**: Novo visual (cor por área, abas reorganizadas, separadores no Perfil).
- **26-11-2026**: Supersets, notas por exercício, pesquisa online de alimentos (Open Food Facts e USDA).
- **26-11-2026**: Correções (temporizador, séries vazias, confirmações), histórico por exercício, peso corporal, alimentos recentes, copiar refeição, calorias de 7 dias, exportar/importar.
- **26-11-2026**: Publicação no GitHub Pages para iPhone; APK Android de teste.
