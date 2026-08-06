# Painel Veneza

Painel financeiro da Veneza Restaurante e Lanchonete. Duas partes no mesmo repo:

- **`connector/`** — script Node que puxa dados do sistema de gestão (Memória
  Info, Firebird, via API REST "ApiMemoria") e sincroniza pro Supabase.
- **`dashboard/`** — app Next.js 16 que lê do Supabase e mostra os números.
  Deploy via Cloudflare (`open-next` + `wrangler`).

Regras de trabalho neste projeto (pedidas pelo Fernando em 2026-08-06):

1. Commitar no git a cada funcionalidade concluída, com mensagem clara do que mudou.
2. Manter este arquivo atualizado — o que está pronto, o que falta.
3. Fazer um commit final ao fim de qualquer sessão de trabalho, mesmo incompleta.

## 📁 Pasta oficial do projeto

**`C:\Users\Veneza\projetos\veneza-dashboard` é a única pasta de trabalho.**
É aqui que roda a task do Windows Task Scheduler `VenezaDashboardSync`
(`connector/scripts/sync-all.mjs`, de hora em hora) com o `.env` real
(Supabase + ApiMemoria), e é aqui que qualquer sessão do Claude Code deve
abrir a partir de agora — rode `claude` de dentro desta pasta.

Histórico: até 2026-08-06 existia uma segunda cópia local em
`C:\Users\Veneza\Documents\GitHub\Painel-veneza` (sem `.env`, usada só pro
trabalho com Claude Code), desalinhada da cópia de produção. Foi confirmado
que ela não tinha nada exclusivo além do `.env`/`.env.local` (esperado), os 2
commits que só existiam lá (criação e atualização do `CLAUDE.md`) foram
trazidos pra cá via `git pull` local e enviados ao `origin/main` no GitHub, e
essa segunda cópia foi descontinuada. **Se alguma sessão futura encontrar
outra pasta com o mesmo remoto, não presuma que está desatualizada nem
apague nada — pare e confirme com o Fernando antes**, do mesmo jeito que fizemos
dessa vez.

## Pronto

### Connector

- `apiMemoriaClient.js`: login/sessão, `consulta` SQL paginada, tratamento de
  erro HTML vs JSON. Cuidados documentados: prefixo de parâmetro `:s`
  (string/ISO) vs `:i` (inteiro) — nunca `:d` pra datas; formato de data BR
  do `valido_ate`.
- 4 syncs (upsert no Supabase): `syncVendas`, `syncRecebimentos`,
  `syncContasPagar`, `syncItensVenda`. Janela configurável via
  `--dias=`/`--de=/--ate=`, suportam `--dry-run`.
- `scripts/sync-all.mjs`: roda os 4 em sequência — pensado pro Task Scheduler
  do Windows, de hora em hora.
- `findTables.js` / `schemaIntrospect.js`: introspecção do schema Firebird
  (usados durante a integração, não fazem parte do fluxo de sync).
- `supabase/schema.sql`: define `vendas`, `recebimentos`, `contas_pagar`,
  `itens_venda` (sincronizadas via connector) + `taxas_adquirente`,
  `ifood_mensal`, `dre_mensal`, `saldo_caixa`, `antecipacoes` (dados manuais,
  RLS pra usuário autenticado).
- Scripts de seed (`scripts/seed-*.mjs`): carga manual pontual — DRE
  jan–abr/2026, relatório iFood mensal (lojas Pratos/Lanches), dívidas
  ativas, reserva, saldo de caixa e antecipação de 06/08/2026.

### Dashboard

- Auth por e-mail/senha (Supabase Auth) + middleware redirecionando sem sessão.
- `/caixa` (home): saldo real das contas, saldo do dia, contas a vencer,
  histórico (30d) + projeção (7d) de caixa considerando prazo de liquidação
  por forma de pagamento (dinheiro/PIX D+0, débito D+1, crédito D+30, iFood
  ~1 semana), projeção de vendas futuras por média histórica por dia da
  semana, déficit de reserva, antecipações de cartão. Formulários inline pra
  atualizar saldo de caixa e registrar antecipação.
- `/contas-a-pagar`: lista com totais em aberto/vencido/pago.
- `/curva-abc`: margem por produto (melhores/piores), últimos 30 dias.
- `/saude`: DRE mensal (CMV%, prime cost, EBITDA, resultado líquido) +
  margem líquida por loja iFood.
- `/margem-canal`: margem de contribuição por canal (Salão/Site/iFood/
  Telefone), janela fixa jan–mai/2026.
- `/divida-reserva`: dívidas ativas, serviço de dívida atual vs. pós-carência
  (jun/2027), meta de reserva vs. saldo real.
- `/dre`: upload/download de PDFs de DRE pro Supabase Storage (sem extração
  automática — dados entram manualmente via seed scripts).

## Pendente / pontos em aberto

1. **Schema desatualizado**: tabelas `dividas` e `reserva_saldo` (usadas por
   `seed-dividas.mjs`/`seed-reserva.mjs` e pela página `/divida-reserva`) não
   estão em `connector/supabase/schema.sql`. Confirmar se foram criadas
   direto no Supabase e atualizar o arquivo.
2. **Bandeira de cartão não rastreada** (`/margem-canal`, `/saude`): o
   `taxaCartaoPct()` sempre busca a modalidade "Visa/Master" na tabela
   `taxas_adquirente`, mesmo quando já existem taxas cadastradas pra Elo/Amex
   (mais caras) — porque `recebimentos` não guarda a bandeira do cartão, só
   `tipo_cartao_tef` (débito/crédito) e `adquirente_tef` (GETNET/VERO). Isso
   tende a subestimar levemente o custo de cartão.
   ~~Adquirente "VERO" sem taxa cadastrada~~ — **resolvido em 2026-08-05**:
   Fernando cadastrou taxas reais para Getnet e Banricompras (mapeado de
   VERO) em `taxas_adquirente`, com valores diferentes por modalidade
   (hoje ~1,34% de taxa média efetiva no canal Salão, jan–mai/2026).
3. **`/margem-canal` com janela fixa hardcoded** (jan–mai/2026) — não é
   dinâmica.
4. **Curva ABC pode ter ruído**: custo cadastrado por caixa/pacote (não por
   unidade) gera margem negativa impossível em alguns itens; itens de
   consumo interno podem se misturar com vendas reais.
5. **Custo de moto-entrega só rateado** proporcional à receita entre
   iFood/Site/Telefone (DRE só tem total mensal, não por canal).
6. **Bandeira de cartão assumida como Visa/Master** por padrão (sistema não
   distingue Visa/Master/Elo/Amex).
7. **DRE por PDF é só upload/download bruto** — sem extração automática pro
   `dre_mensal`.
8. **Sync depende do Task Scheduler do Windows local** — se a máquina não
   estiver ligada, os dados param de atualizar. Nada rodando na nuvem.
9. **`itens_venda.custo_unit` é custo atual do produto**, não snapshot
   histórico — margem de vendas antigas muda se o custo cadastrado mudar hoje.
10. **Alguns produtos na Curva ABC têm custo cadastrado por caixa/pacote, não
    por dose/unidade** — confirmado em 2026-08-06: caipirinhas (todos os
    sabores) e Suco Tropical mostram custo médio agrupado em R$21–22,
    independente do sabor, sinal claro de custo lançado por
    garrafa/lote. Gera margem negativa impossível (custo > preço de venda).
11. **`itens_venda` de um pedido específico costuma não bater com o valor
    total do pedido** (`vendas.valor`) — parecem faltar linhas de item em
    muitos pedidos individuais. O total agregado por mês/canal (usado em
    `/margem-canal` e `/curva-abc`) parece internamente consistente (CMV%
    plausível), mas não dá pra confiar no detalhe de um pedido isolado.
12. **Canais de origem não mapeados**: além de Salão/Site/iFood/Telefone,
    aparecem valores de `os_site` como "AUTOATEND" e "AUTOATENDIMENTO"
    (provavelmente autoatendimento/totem) que `normalizeCanal()` não
    reconhece — viram canais próprios pequenos em `/margem-canal` em vez de
    caírem numa categoria conhecida.
13. **Sync sem trilha de auditoria**: `sync-all.mjs` roda via Task Scheduler
    mas não grava log em arquivo (`stdio: 'inherit'` se perde numa tarefa
    agendada sem console) e o histórico de execuções do Task Scheduler está
    desabilitado nesta máquina — só dá pra ver o resultado da ÚLTIMA
    execução, nenhuma anterior. Se um sync falhar de madrugada, ninguém fica
    sabendo. Também vale saber que `sincronizado_em` só atualiza quando uma
    linha é inserida pela primeira vez (upsert não reenvia essa coluna em
    updates), então uma tabela com timestamp mais antigo não significa
    necessariamente que o sync falhou.
