import 'dotenv/config';
import { consultaTodasPaginas } from './apiMemoriaClient.js';
import { getSupabase } from './supabaseClient.js';
import { resolverPeriodo } from './periodo.js';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const { ini, fim } = resolverPeriodo(args, 7);
const toIso = (d) => d.toISOString().slice(0, 10);

// Itens por pedido (nivel produto), pra curva ABC / margem real por item.
// TAB_ITEM_VENDA_OK.ID_VENDA = TAB_ORDEMSERVICO.OS_CODIGO (confirmado
// testando contra um pedido real). PRD_CUSTO vem do cadastro atual do
// produto (tab_produto), nao um snapshot historico da venda -- o Marcelo
// disse que o sistema salva o custo "daquele momento", mas nao achamos esse
// campo em TAB_ITEM_VENDA_OK; usar o custo atual e a aproximacao disponivel.
const ITENS_SQL = `
  select
    iv.id_item as ID_ITEM,
    iv.id_venda as OS_CODIGO,
    os.os_datafechamento as DATA,
    iv.prd_codigo as PRD_CODIGO,
    p.prd_nome as PRODUTO,
    iv.qtd as QTD,
    iv.vunit as VUNIT,
    p.prd_custo as CUSTO_UNIT
  from tab_item_venda_ok iv
  join tab_ordemservico os on os.os_codigo = iv.id_venda
  join tab_produto p on p.prd_codigo = iv.prd_codigo
  where os.os_datafechamento between :sIni and :sFim
    and os.os_status in ('FATURADO', 'FECHADO')
`;

async function main() {
  console.log(`Buscando itens de venda de ${toIso(ini)} a ${toIso(fim)}...`);

  const itens = await consultaTodasPaginas(ITENS_SQL, {
    SINI: toIso(ini),
    SFIM: toIso(fim),
  });

  console.log(`${itens.length} item(ns) de venda encontrado(s).`);

  if (dryRun) {
    console.table(itens.slice(0, 20));
    return;
  }

  const supabase = getSupabase();
  const { error } = await supabase.from('itens_venda').upsert(
    itens.map((i) => ({
      id_item: i.ID_ITEM,
      os_codigo: i.OS_CODIGO,
      data: i.DATA,
      prd_codigo: i.PRD_CODIGO,
      produto: i.PRODUTO,
      qtd: i.QTD,
      vunit: i.VUNIT,
      custo_unit: i.CUSTO_UNIT,
    })),
    { onConflict: 'id_item' }
  );

  if (error) throw error;
  console.log('Itens de venda sincronizados no Supabase.');
}

main().catch((err) => {
  console.error('Erro ao sincronizar itens de venda:', err.message);
  process.exit(1);
});
