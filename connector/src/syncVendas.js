import 'dotenv/config';
import { consultaTodasPaginas } from './apiMemoriaClient.js';
import { getSupabase } from './supabaseClient.js';
import { resolverPeriodo } from './periodo.js';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const { ini, fim } = resolverPeriodo(args, 7);
const toIso = (d) => d.toISOString().slice(0, 10);

// Campos confirmados via schemaIntrospect.js em TAB_ORDEMSERVICO.
// Forma de pagamento NAO entra aqui: um pedido pode ter mais de um pagamento
// (ex: parte dinheiro, parte cartao), entao no pedido so aparece um valor e
// fica errado. Isso vem de uma consulta separada pelos recebimentos -- ver
// syncRecebimentos.js.
// os_site vem tambem aqui (nao so em recebimentos) pra dar pra ligar
// itens_venda ao canal direto por os_codigo, sem precisar passar por
// recebimentos (que pode ter 0, 1 ou varias linhas por pedido).
const VENDAS_SQL = `
  select
    os.os_codigo as OS_CODIGO,
    os.os_datafechamento as DATA,
    os.os_status as STATUS,
    os.os_vlrtotal as VALOR,
    os.os_cliente as CLIENTE,
    os.os_site as ORIGEM
  from tab_ordemservico os
  where os.os_datafechamento >= :sIni
    and os.os_datafechamento <= :sFim
    and os.os_status in ('FATURADO', 'FECHADO')
`;

async function main() {
  console.log(`Buscando vendas de ${toIso(ini)} a ${toIso(fim)}...`);

  const vendas = await consultaTodasPaginas(VENDAS_SQL, {
    SINI: toIso(ini),
    SFIM: toIso(fim),
  });

  console.log(`${vendas.length} venda(s) encontrada(s).`);

  if (dryRun) {
    console.table(vendas.slice(0, 20));
    return;
  }

  const supabase = getSupabase();
  const { error } = await supabase.from('vendas').upsert(
    vendas.map((v) => ({
      os_codigo: v.OS_CODIGO,
      data: v.DATA,
      status: v.STATUS,
      valor: v.VALOR,
      cliente: v.CLIENTE,
      // vazio = salao (mesma convencao de recebimentos.origem)
      origem: v.ORIGEM || '',
    })),
    { onConflict: 'os_codigo' }
  );

  if (error) throw error;
  console.log('Vendas sincronizadas no Supabase.');
}

main().catch((err) => {
  console.error('Erro ao sincronizar vendas:', err.message);
  process.exit(1);
});
