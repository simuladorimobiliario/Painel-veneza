-- Rode isso no SQL editor do Supabase para criar as tabelas iniciais.

create table if not exists vendas (
  os_codigo bigint primary key,
  data date not null,
  status text not null,
  valor numeric(12, 2),
  cliente text,
  sincronizado_em timestamptz not null default now()
);

-- Um pedido pode ter mais de um pagamento (ex: parte dinheiro, parte cartao),
-- por isso isso e uma tabela a parte de "vendas", em vez de uma coluna
-- forma_pagamento no pedido -- cada linha aqui e um pagamento, nao um pedido.
-- `pedido` sem FK pra vendas(os_codigo) de proposito: pode vir nulo (contas a
-- receber que nao sao de venda, segundo aviso do Marcelo) e os dois syncs
-- rodam independentes, entao nao da pra garantir ordem de chegada.
-- `origem` em branco = pedido do salao; preenchido = canal (ex: ifood, site).
create table if not exists recebimentos (
  prc_codigo bigint primary key,
  ctr_codigo bigint,
  pedido bigint,
  origem text,
  data_recebimento date not null,
  valor numeric(12, 2) not null,
  desconto numeric(12, 2) not null default 0,
  juros numeric(12, 2) not null default 0,
  valor_recebido numeric(12, 2) not null,
  id_forma_pagamento integer,
  forma_pagamento text,
  tipo_cartao_tef text,
  adquirente_tef text,
  sincronizado_em timestamptz not null default now()
);

create table if not exists contas_pagar (
  ctp_codigo bigint primary key,
  data_vencimento date not null,
  data_pagamento date,
  valor numeric(12, 2) not null,
  desconto numeric(12, 2) not null default 0,
  juros numeric(12, 2) not null default 0,
  valor_pago numeric(12, 2) not null default 0,
  saldo numeric(12, 2) not null default 0,
  status text not null,
  observacao text,
  frn_codigo bigint,
  fornecedor text,
  sincronizado_em timestamptz not null default now()
);

-- Nivel produto (nao pedido) -- base pra curva ABC / margem real por item.
-- custo_unit vem do cadastro ATUAL do produto (tab_produto.prd_custo), nao
-- de um snapshot historico da venda -- se o custo do produto mudar, vendas
-- antigas passam a refletir o custo novo ao reconsultar a API.
create table if not exists itens_venda (
  id_item bigint primary key,
  os_codigo bigint,
  data date not null,
  prd_codigo bigint,
  produto text,
  qtd numeric(12, 3) not null,
  vunit numeric(12, 2) not null,
  custo_unit numeric(12, 2),
  sincronizado_em timestamptz not null default now()
);

-- Taxas de adquirente/cartao, alimentadas manualmente pelo Fernando (o
-- sistema Memoria Info nao tem isso cadastrado). vigente_desde permite
-- historico se a taxa mudar no futuro, sem apagar a antiga.
create table if not exists taxas_adquirente (
  id bigint generated always as identity primary key,
  adquirente text not null,
  modalidade text not null,
  taxa_pct numeric(6, 3) not null,
  vigente_desde date not null default current_date,
  criado_em timestamptz not null default now(),
  unique (adquirente, modalidade, vigente_desde)
);

-- Relatorio financeiro do iFood, colado manualmente mes a mes (formato
-- flexivel em vez de uma coluna por item, porque a lista de taxas/promocoes
-- do relatorio pode variar de um mes pro outro). Fernando roda duas lojas
-- separadas no iFood (Veneza Pratos e Veneza Lanches), cada uma com seu
-- proprio relatorio -- daí a coluna `loja`.
create table if not exists ifood_mensal (
  id bigint generated always as identity primary key,
  mes_referencia date not null,
  loja text not null,
  categoria text not null,
  item text not null,
  pedidos integer,
  valor numeric(12, 2) not null,
  criado_em timestamptz not null default now(),
  unique (mes_referencia, loja, categoria, item)
);

-- DRE mensal, extraido dos PDFs que o Fernando exporta do sistema. Formato
-- flexivel (categoria/item) pelo mesmo motivo do ifood_mensal -- a estrutura
-- exata do DRE so vai ficar clara quando o primeiro PDF for lido.
create table if not exists dre_mensal (
  id bigint generated always as identity primary key,
  mes_referencia date not null,
  categoria text not null,
  item text not null,
  valor numeric(12, 2) not null,
  criado_em timestamptz not null default now(),
  unique (mes_referencia, categoria, item)
);

alter table taxas_adquirente enable row level security;
drop policy if exists "Authenticated can read taxas_adquirente" on taxas_adquirente;
create policy "Authenticated can read taxas_adquirente" on taxas_adquirente for select to authenticated using (true);
drop policy if exists "Authenticated can write taxas_adquirente" on taxas_adquirente;
create policy "Authenticated can write taxas_adquirente" on taxas_adquirente for insert to authenticated with check (true);

alter table ifood_mensal enable row level security;
drop policy if exists "Authenticated can read ifood_mensal" on ifood_mensal;
create policy "Authenticated can read ifood_mensal" on ifood_mensal for select to authenticated using (true);
drop policy if exists "Authenticated can write ifood_mensal" on ifood_mensal;
create policy "Authenticated can write ifood_mensal" on ifood_mensal for insert to authenticated with check (true);

alter table dre_mensal enable row level security;
drop policy if exists "Authenticated can read dre_mensal" on dre_mensal;
create policy "Authenticated can read dre_mensal" on dre_mensal for select to authenticated using (true);
drop policy if exists "Authenticated can write dre_mensal" on dre_mensal;
create policy "Authenticated can write dre_mensal" on dre_mensal for insert to authenticated with check (true);

-- Saldo real das contas (Santander, Banrisul, Sicredi, Caixa), alimentado
-- manualmente por Fernando pela tela /caixa -- nao e sincronizado de nenhum
-- sistema. Uma linha por (data_referencia, conta); o dashboard usa o ULTIMO
-- registro de cada conta (nao so a data mais recente entre todas), pra
-- atualizar so a conta que mudou sem "apagar" as outras. Tratado como saldo
-- de ABERTURA do dia daquele registro (antes dos pagamentos do dia).
-- Contas reais 2026-08-06: Banrisul e Santander pagam contas; Sicredi nao
-- paga nada, so recebe o PIX do dia que depois e repassado pro Banri/
-- Santander; Caixa = cofre fisico.
create table if not exists saldo_caixa (
  id bigint generated always as identity primary key,
  data_referencia date not null,
  valor numeric(12, 2) not null,
  conta text,
  observacao text,
  criado_em timestamptz not null default now()
);

-- Registro manual de cada antecipacao de recebiveis de cartao feita pra
-- cobrir falta de caixa -- "o preco de nao ter reserva". valor_possivel e
-- opcional (quanto dava pra antecipar no total). `conta` = onde o valor
-- antecipado caiu (geralmente Santander, as vezes Banrisul).
create table if not exists antecipacoes (
  id bigint generated always as identity primary key,
  data_referencia date not null,
  valor_antecipado numeric(12, 2) not null,
  valor_possivel numeric(12, 2),
  taxa_paga numeric(12, 2) not null,
  conta text,
  observacao text,
  criado_em timestamptz not null default now()
);

alter table saldo_caixa enable row level security;
drop policy if exists "Authenticated can read saldo_caixa" on saldo_caixa;
create policy "Authenticated can read saldo_caixa" on saldo_caixa for select to authenticated using (true);
drop policy if exists "Authenticated can write saldo_caixa" on saldo_caixa;
create policy "Authenticated can write saldo_caixa" on saldo_caixa for insert to authenticated with check (true);

alter table antecipacoes enable row level security;
drop policy if exists "Authenticated can read antecipacoes" on antecipacoes;
create policy "Authenticated can read antecipacoes" on antecipacoes for select to authenticated using (true);
drop policy if exists "Authenticated can write antecipacoes" on antecipacoes;
create policy "Authenticated can write antecipacoes" on antecipacoes for insert to authenticated with check (true);
