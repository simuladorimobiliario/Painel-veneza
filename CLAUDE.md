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
2. **Margem do salão sem taxa de cartão real** (`/saude`): sistema só
   registra "Getnet crédito/débito" sem bandeira, e existe uma adquirente
   "VERO" não cadastrada em `taxas_adquirente`.
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
