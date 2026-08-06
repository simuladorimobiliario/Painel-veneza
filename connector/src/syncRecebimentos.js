import 'dotenv/config';
import { consultaTodasPaginas } from './apiMemoriaClient.js';
import { getSupabase } from './supabaseClient.js';
import { resolverPeriodo } from './periodo.js';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const { ini, fim } = resolverPeriodo(args, 7);
const toIso = (d) => d.toISOString().slice(0, 10);

// SQL do Marcelo. Ele usou :DINI/:DFIM (prefixo "d"), mas o proprio guia da
// ApiMemoria avisa que esse prefixo falha na conversao de data -- troquei
// para prefixo "s" (string/ISO), que e o que de fato funciona.
//
// ORIGEM vem de um subselect -- por causa disso `records` sempre volta -1
// (a API corta a contagem no primeiro "from" e o subselect atrapalha isso).
// Sem problema: consultaTodasPaginas ja pagina pelo tamanho da pagina
// retornada nesse caso, nao depende de `records`.
//
// Regra de negocio do Marcelo pro campo ORIGEM: em branco = pedido do SALAO;
// preenchido = indica a origem (ex: ifood, site).
//
// Aviso do Marcelo: se o sistema for usado pra cadastrar outros contas a
// receber (ex: outras fontes de renda), eles tambem aparecem aqui, com
// PEDIDO nulo.
const RECEBIMENTOS_SQL = `
  select
    r.os_codigo as PEDIDO,
    (select o.os_site from tab_ordemservico o where o.os_codigo = r.os_codigo) as ORIGEM,
    p.prc_codigo as PRC_CODIGO,
    r.ctr_codigo as CTR_CODIGO,
    p.prc_data as DATA_RECEBIMENTO,
    p.prc_valor as VALOR,
    p.prc_desconto as DESCONTO,
    p.prc_juros as JUROS,
    (p.prc_valor + p.prc_juros - p.prc_desconto) as VALOR_RECEBIDO,
    f.pgt_codigo as ID_FORMA_PAGAMENTO,
    f.pgt_descricao as FORMA_PAGAMENTO,
    p.prc_tipocrt_tef as TIPO_CARTAO_TEF,
    p.prc_rede_tef as ADQUIRENTE_TEF
  from tab_contasreceber r
  join tab_parcelas p on r.ctr_codigo = p.ctr_codigo
  join tab_formapgto f on p.pgt_codigo = f.pgt_codigo
  where p.prc_data between :sDini and :sDfim
`;

async function main() {
  console.log(`Buscando recebimentos de ${toIso(ini)} a ${toIso(fim)}...`);

  const recebimentos = await consultaTodasPaginas(RECEBIMENTOS_SQL, {
    SDINI: toIso(ini),
    SDFIM: toIso(fim),
  });

  console.log(`${recebimentos.length} recebimento(s) encontrado(s).`);

  if (dryRun) {
    console.table(recebimentos.slice(0, 20));
    return;
  }

  const supabase = getSupabase();
  const { error } = await supabase.from('recebimentos').upsert(
    recebimentos.map((r) => ({
      prc_codigo: r.PRC_CODIGO,
      ctr_codigo: r.CTR_CODIGO,
      pedido: r.PEDIDO,
      origem: r.ORIGEM,
      data_recebimento: r.DATA_RECEBIMENTO,
      valor: r.VALOR,
      desconto: r.DESCONTO,
      juros: r.JUROS,
      valor_recebido: r.VALOR_RECEBIDO,
      id_forma_pagamento: r.ID_FORMA_PAGAMENTO,
      forma_pagamento: r.FORMA_PAGAMENTO,
      tipo_cartao_tef: r.TIPO_CARTAO_TEF,
      adquirente_tef: r.ADQUIRENTE_TEF,
    })),
    { onConflict: 'prc_codigo' }
  );

  if (error) throw error;
  console.log('Recebimentos sincronizados no Supabase.');
}

main().catch((err) => {
  console.error('Erro ao sincronizar recebimentos:', err.message);
  process.exit(1);
});
