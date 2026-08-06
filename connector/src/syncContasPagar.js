import 'dotenv/config';
import { consultaTodasPaginas } from './apiMemoriaClient.js';
import { getSupabase } from './supabaseClient.js';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const diasAtras = Number(args.find((a) => a.startsWith('--dias-atras='))?.split('=')[1]) || 30;
// BUG encontrado 2026-08-05: a janela original so olhava pra tras (agora -
// diasAtras ate agora), entao contas a pagar com vencimento FUTURO ja
// cadastradas no Memoria Info nunca eram sincronizadas -- "Contas a vencer"
// no dashboard sempre dava 0 mesmo com contas reais cadastradas la na frente.
const diasFrente = Number(args.find((a) => a.startsWith('--dias-frente='))?.split('=')[1]) || 60;

const hoje = new Date();
const ini = new Date(hoje.getTime() - diasAtras * 24 * 60 * 60 * 1000);
const fim = new Date(hoje.getTime() + diasFrente * 24 * 60 * 60 * 1000);
const toIso = (d) => d.toISOString().slice(0, 10);

// Campos confirmados via schemaIntrospect.js em TAB_CONTASPAGAR e TAB_FORNECEDOR.
// Filtra por vencimento (nao por pagamento), pra pegar tanto o que ja foi
// pago quanto o que ainda esta em aberto dentro do periodo.
const CONTAS_PAGAR_SQL = `
  select
    cp.ctp_codigo as CTP_CODIGO,
    cp.ctp_datavcto as DATA_VENCIMENTO,
    cp.ctp_datapgto as DATA_PAGAMENTO,
    cp.ctp_valor as VALOR,
    cp.ctp_desconto as DESCONTO,
    cp.ctp_juros as JUROS,
    cp.ctp_valorpago as VALOR_PAGO,
    cp.ctp_saldo as SALDO,
    cp.ctp_status as STATUS,
    cp.ctp_obs as OBSERVACAO,
    f.frn_codigo as FRN_CODIGO,
    f.frn_razaosocial as FORNECEDOR
  from tab_contaspagar cp
  left join tab_fornecedor f on cp.frn_codigo = f.frn_codigo
  where cp.ctp_datavcto between :sDini and :sDfim
`;

async function main() {
  console.log(`Buscando contas a pagar de ${toIso(ini)} a ${toIso(fim)}...`);

  const contas = await consultaTodasPaginas(CONTAS_PAGAR_SQL, {
    SDINI: toIso(ini),
    SDFIM: toIso(fim),
  });

  console.log(`${contas.length} conta(s) a pagar encontrada(s).`);

  if (dryRun) {
    console.table(contas.slice(0, 20));
    return;
  }

  const supabase = getSupabase();
  const { error } = await supabase.from('contas_pagar').upsert(
    contas.map((c) => ({
      ctp_codigo: c.CTP_CODIGO,
      data_vencimento: c.DATA_VENCIMENTO,
      data_pagamento: c.DATA_PAGAMENTO,
      valor: c.VALOR,
      desconto: c.DESCONTO,
      juros: c.JUROS,
      valor_pago: c.VALOR_PAGO,
      saldo: c.SALDO,
      status: c.STATUS,
      observacao: c.OBSERVACAO,
      frn_codigo: c.FRN_CODIGO,
      fornecedor: c.FORNECEDOR,
    })),
    { onConflict: 'ctp_codigo' }
  );

  if (error) throw error;
  console.log('Contas a pagar sincronizadas no Supabase.');
}

main().catch((err) => {
  console.error('Erro ao sincronizar contas a pagar:', err.message);
  process.exit(1);
});
