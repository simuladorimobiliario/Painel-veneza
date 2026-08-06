import { getSupabase } from '../src/supabaseClient.js';

const supabase = getSupabase();

// ---------- iFood mensal ----------

function mkRows(mes, loja, secoes) {
  const rows = [];
  for (const [categoria, itens] of Object.entries(secoes)) {
    for (const item of itens) {
      rows.push({
        mes_referencia: mes,
        loja,
        categoria,
        item: item.item,
        pedidos: item.pedidos ?? null,
        valor: item.valor,
      });
    }
  }
  return rows;
}

const pratos = [
  mkRows('2026-01-01', 'pratos', {
    vendas: [
      { item: 'Valor dos itens e entrega própria da loja', valor: 56355.50 },
      { item: 'Cancelamentos', pedidos: 1, valor: -95.03 },
      { item: 'Total', valor: 56260.47 },
    ],
    taxas_comissoes: [
      { item: 'Comissão iFood - entrega própria', pedidos: 686, valor: -6189.78 },
      { item: 'Taxa de antecipação do plano de repasse semanal', pedidos: 628, valor: -926.76 },
      { item: 'Comissão iFood - pedidos pra retirar', pedidos: 56, valor: -369.77 },
      { item: 'Taxa de transação de pagamento online', pedidos: 628, valor: -1491.28 },
      { item: 'Mensalidade iFood', valor: -110.00 },
      { item: 'Total', valor: -9087.59 },
    ],
    promocoes: [
      { item: 'Promoções incentivadas pela loja', pedidos: 341, valor: -1699.58 },
      { item: 'Total', valor: -1699.58 },
    ],
    servicos: [
      { item: 'Pacote de anúncios', valor: -587.94 },
      { item: 'Total', valor: -587.94 },
    ],
    ajustes: [
      { item: 'Reembolso da taxa de serviço cobrada do cliente', pedidos: 74, valor: 2.40 },
      { item: 'Total', valor: 2.40 },
    ],
    faturamento: [
      { item: 'Valores recebidos direto pela loja', pedidos: 114, valor: 7841.81 },
      { item: 'Valor dos repasses', valor: 37045.95 },
      { item: 'Total', valor: 44887.76 },
    ],
  }),
  mkRows('2026-02-01', 'pratos', {
    vendas: [
      { item: 'Valor dos itens e entrega própria da loja', valor: 67108.90 },
      { item: 'Cancelamentos', pedidos: 1, valor: -8.50 },
      { item: 'Total', valor: 67100.40 },
    ],
    taxas_comissoes: [
      { item: 'Taxa de antecipação do plano de repasse semanal', pedidos: 750, valor: -1135.99 },
      { item: 'Comissão iFood - pedidos pra retirar', pedidos: 64, valor: -434.58 },
      { item: 'Comissão iFood - entrega própria', pedidos: 797, valor: -7342.23 },
      { item: 'Taxa de transação de pagamento online', pedidos: 750, valor: -1828.69 },
      { item: 'Reembolso da Comissão iFood - entrega parceira', valor: 1.02 },
      { item: 'Mensalidade iFood', valor: -110.00 },
      { item: 'Total', valor: -10850.47 },
    ],
    promocoes: [
      { item: 'Promoções incentivadas pela loja', pedidos: 463, valor: -2314.30 },
      { item: 'Total', valor: -2314.30 },
    ],
    servicos: [
      { item: 'Pacote de anúncios', valor: -2400.00 },
      { item: 'Total', valor: -2400.00 },
    ],
    ajustes: [
      { item: 'Reembolso da taxa de serviço cobrada do cliente', pedidos: 78, valor: 2.58 },
      { item: 'Total', valor: 2.58 },
    ],
    faturamento: [
      { item: 'Valores recebidos direto pela loja', pedidos: 111, valor: 7406.80 },
      { item: 'Valor dos repasses', valor: 44131.41 },
      { item: 'Total', valor: 51538.21 },
    ],
  }),
  mkRows('2026-03-01', 'pratos', {
    vendas: [
      { item: 'Valor dos itens e entrega própria da loja', valor: 76687.50 },
      { item: 'Cancelamentos', pedidos: 1, valor: -100.00 },
      { item: 'Total', valor: 76587.50 },
    ],
    taxas_comissoes: [
      { item: 'Comissão iFood - entrega própria', pedidos: 917, valor: -8466.75 },
      { item: 'Comissão iFood - pedidos pra retirar', pedidos: 52, valor: -368.98 },
      { item: 'Taxa de antecipação do plano de repasse semanal', pedidos: 868, valor: -1311.07 },
      { item: 'Reembolso da Comissão iFood - entrega parceira', valor: 12.00 },
      { item: 'Taxa de transação de pagamento online', pedidos: 868, valor: -2110.01 },
      { item: 'Mensalidade iFood', valor: -110.00 },
      { item: 'Total', valor: -12354.81 },
    ],
    promocoes: [
      { item: 'Promoções incentivadas pela loja', pedidos: 616, valor: -3069.52 },
      { item: 'Total', valor: -3069.52 },
    ],
    servicos: [
      { item: 'Pacote de anúncios', valor: -2803.74 },
      { item: 'Total', valor: -2803.74 },
    ],
    ajustes: [
      { item: 'Reembolso da taxa de serviço cobrada do cliente', pedidos: 65, valor: 2.13 },
      { item: 'Total', valor: 2.13 },
    ],
    faturamento: [
      { item: 'Valores recebidos direto pela loja', pedidos: 101, valor: 7390.52 },
      { item: 'Valor dos repasses', valor: 50971.04 },
      { item: 'Total', valor: 58361.56 },
    ],
  }),
  mkRows('2026-04-01', 'pratos', {
    vendas: [
      { item: 'Valor dos itens e entrega própria da loja', valor: 62709.60 },
      { item: 'Cancelamentos', pedidos: 3, valor: -38.90 },
      { item: 'Total', valor: 62670.70 },
    ],
    taxas_comissoes: [
      { item: 'Comissão iFood - entrega própria', pedidos: 741, valor: -6827.82 },
      { item: 'Taxa de transação de pagamento online', pedidos: 713, valor: -1732.29 },
      { item: 'Comissão iFood - pedidos pra retirar', pedidos: 51, valor: -376.14 },
      { item: 'Taxa de antecipação do plano de repasse semanal', pedidos: 703, valor: -1062.67 },
      { item: 'Reembolso da Comissão iFood - entrega parceira', valor: 4.66 },
      { item: 'Mensalidade iFood', valor: -110.00 },
      { item: 'Total', valor: -10104.26 },
    ],
    promocoes: [
      { item: 'Promoções incentivadas pela loja', pedidos: 541, valor: -2683.80 },
      { item: 'Total', valor: -2683.80 },
    ],
    servicos: [
      { item: 'Pacote de anúncios', valor: -328.59 },
      { item: 'Total', valor: -328.59 },
    ],
    ajustes: [
      { item: 'Reembolso da taxa de serviço cobrada do cliente', pedidos: 62, valor: 2.01 },
      { item: 'Crédito - Taxa de transação de pagamento online', pedidos: 10, valor: 23.07 },
      { item: 'Total', valor: 25.08 },
    ],
    faturamento: [
      { item: 'Valores recebidos direto pela loja', pedidos: 89, valor: 6317.90 },
      { item: 'Valor dos repasses', valor: 43261.23 },
      { item: 'Total', valor: 49579.13 },
    ],
  }),
  mkRows('2026-05-01', 'pratos', {
    vendas: [
      { item: 'Valor dos itens e entrega própria da loja', valor: 64692.00 },
      { item: 'Cancelamentos', pedidos: 2, valor: -51.00 },
      { item: 'Total', valor: 64641.00 },
    ],
    taxas_comissoes: [
      { item: 'Taxa de antecipação do plano de repasse semanal', pedidos: 790, valor: -1084.29 },
      { item: 'Comissão iFood - pedidos pra retirar', pedidos: 29, valor: -227.60 },
      { item: 'Taxa de transação de pagamento online', pedidos: 790, valor: -1745.10 },
      { item: 'Comissão iFood - entrega própria', pedidos: 873, valor: -7225.95 },
      { item: 'Reembolso da Comissão iFood - entrega parceira', valor: 0.95 },
      { item: 'Mensalidade iFood', valor: -110.00 },
      { item: 'Total', valor: -10391.99 },
    ],
    promocoes: [
      { item: 'Promoções incentivadas pela loja', pedidos: 522, valor: -2595.45 },
      { item: 'Total', valor: -2595.45 },
    ],
    servicos: [{ item: 'Total', valor: 0.00 }],
    ajustes: [
      { item: 'Reembolso da taxa de serviço cobrada do cliente', pedidos: 81, valor: 3.35 },
      { item: 'Total', valor: 3.35 },
    ],
    faturamento: [
      { item: 'Valores recebidos direto pela loja', pedidos: 112, valor: 7233.57 },
      { item: 'Valor dos repasses', valor: 44423.34 },
      { item: 'Total', valor: 51656.91 },
    ],
  }),
  mkRows('2026-06-01', 'pratos', {
    vendas: [
      { item: 'Valor dos itens e entrega própria da loja', valor: 58203.60 },
      { item: 'Cancelamentos', pedidos: 2, valor: -16.90 },
      { item: 'Total', valor: 58186.70 },
    ],
    taxas_comissoes: [
      { item: 'Taxa de transação de pagamento online', pedidos: 741, valor: -1594.25 },
      { item: 'Comissão iFood - entrega própria', pedidos: 818, valor: -6547.82 },
      { item: 'Taxa de antecipação do plano de repasse semanal', pedidos: 741, valor: -990.35 },
      { item: 'Comissão iFood - pedidos pra retirar', pedidos: 19, valor: -146.26 },
      { item: 'Reembolso da Comissão iFood - entrega parceira', valor: 2.03 },
      { item: 'Mensalidade iFood', valor: -110.00 },
      { item: 'Total', valor: -9386.65 },
    ],
    promocoes: [
      { item: 'Promoções incentivadas pela loja', pedidos: 491, valor: -2434.10 },
      { item: 'Total', valor: -2434.10 },
    ],
    servicos: [
      { item: 'Pacote de anúncios', valor: -365.00 },
      { item: 'Total', valor: -365.00 },
    ],
    ajustes: [
      { item: 'Reembolso da taxa de serviço cobrada do cliente', pedidos: 76, valor: 2.87 },
      { item: 'Total', valor: 2.87 },
    ],
    faturamento: [
      { item: 'Valores recebidos direto pela loja', pedidos: 96, valor: 5699.32 },
      { item: 'Valor dos repasses', valor: 40304.50 },
      { item: 'Total', valor: 46003.82 },
    ],
  }),
  mkRows('2026-07-01', 'pratos', {
    vendas: [
      { item: 'Valor dos itens e entrega própria da loja', valor: 66577.50 },
      { item: 'Cancelamentos', pedidos: 2, valor: -19.90 },
      { item: 'Reembolso de pedidos cancelados', pedidos: 1, valor: 32.22 },
      { item: 'Total', valor: 66589.82 },
    ],
    taxas_comissoes: [
      { item: 'Comissão iFood - entrega própria', pedidos: 879, valor: -7517.36 },
      { item: 'Taxa de transação de pagamento online', pedidos: 790, valor: -1823.64 },
      { item: 'Comissão iFood - pedidos pra retirar', pedidos: 18, valor: -169.68 },
      { item: 'Taxa de antecipação do plano de repasse semanal', pedidos: 789, valor: -1131.75 },
      { item: 'Reembolso da Comissão iFood - entrega parceira', valor: 1.56 },
      { item: 'Mensalidade iFood', valor: -110.00 },
      { item: 'Total', valor: -10750.87 },
    ],
    promocoes: [
      { item: 'Promoções incentivadas pela loja', pedidos: 508, valor: -2528.61 },
      { item: 'Total', valor: -2528.61 },
    ],
    servicos: [
      { item: 'Pacote de anúncios', valor: -1004.77 },
      { item: 'Total', valor: -1004.77 },
    ],
    ajustes: [
      { item: 'Reembolso da taxa de serviço cobrada do cliente', pedidos: 68, valor: 2.85 },
      { item: 'Total', valor: 2.85 },
    ],
    faturamento: [
      { item: 'Valores recebidos direto pela loja', pedidos: 107, valor: 6765.71 },
      { item: 'Valor dos repasses', valor: 45542.71 },
      { item: 'Total', valor: 52308.42 },
    ],
  }),
].flat();

const lanches = [
  mkRows('2026-01-01', 'lanches', {
    vendas: [
      { item: 'Valor dos itens e entrega própria da loja', valor: 15310.30 },
      { item: 'Cancelamentos', pedidos: 2, valor: -85.00 },
      { item: 'Total', valor: 15225.30 },
    ],
    taxas_comissoes: [
      { item: 'Comissão iFood - entrega própria', pedidos: 189, valor: -1609.73 },
      { item: 'Comissão iFood - pedidos pra retirar', pedidos: 28, valor: -176.23 },
      { item: 'Taxa de transação de pagamento online', pedidos: 170, valor: -383.42 },
      { item: 'Reembolso da Comissão iFood - entrega parceira', valor: 0.60 },
      { item: 'Mensalidade iFood', valor: -100.00 },
      { item: 'Total', valor: -2268.78 },
    ],
    promocoes: [
      { item: 'Promoções incentivadas pela loja', pedidos: 86, valor: -430.00 },
      { item: 'Total', valor: -430.00 },
    ],
    servicos: [{ item: 'Total', valor: 0.00 }],
    ajustes: [
      { item: 'Reembolso da taxa de serviço cobrada do cliente', pedidos: 35, valor: 1.02 },
      { item: 'Total', valor: 1.02 },
    ],
    faturamento: [
      { item: 'Valores recebidos direto pela loja', pedidos: 47, valor: 2791.50 },
      { item: 'Valor dos repasses', valor: 9736.04 },
      { item: 'Total', valor: 12527.54 },
    ],
  }),
  mkRows('2026-02-01', 'lanches', {
    vendas: [
      { item: 'Valor dos itens e entrega própria da loja', valor: 15645.80 },
      { item: 'Cancelamentos', pedidos: 1, valor: -5.00 },
      { item: 'Total', valor: 15640.80 },
    ],
    taxas_comissoes: [
      { item: 'Comissão iFood - entrega própria', pedidos: 164, valor: -1540.12 },
      { item: 'Comissão iFood - pedidos pra retirar', pedidos: 34, valor: -248.34 },
      { item: 'Taxa de transação de pagamento online', pedidos: 165, valor: -399.38 },
      { item: 'Mensalidade iFood', valor: -100.00 },
      { item: 'Total', valor: -2287.84 },
    ],
    promocoes: [
      { item: 'Promoções incentivadas pela loja', pedidos: 148, valor: -739.75 },
      { item: 'Total', valor: -739.75 },
    ],
    servicos: [
      { item: 'Pacote de anúncios', valor: -76.11 },
      { item: 'Total', valor: -76.11 },
    ],
    ajustes: [
      { item: 'Reembolso da taxa de serviço cobrada do cliente', pedidos: 20, valor: 0.72 },
      { item: 'Total', valor: 0.72 },
    ],
    faturamento: [
      { item: 'Valores recebidos direto pela loja', pedidos: 33, valor: 2276.86 },
      { item: 'Valor dos repasses', valor: 10260.96 },
      { item: 'Total', valor: 12537.82 },
    ],
  }),
  mkRows('2026-03-01', 'lanches', {
    vendas: [
      { item: 'Valor dos itens e entrega própria da loja', valor: 17623.40 },
      { item: 'Cancelamentos', pedidos: 2, valor: -11.00 },
      { item: 'Total', valor: 17612.40 },
    ],
    taxas_comissoes: [
      { item: 'Comissão iFood - pedidos pra retirar', pedidos: 36, valor: -246.27 },
      { item: 'Taxa de transação de pagamento online', pedidos: 183, valor: -445.12 },
      { item: 'Comissão iFood - entrega própria', pedidos: 185, valor: -1768.20 },
      { item: 'Reembolso da Comissão iFood - entrega parceira', valor: 1.32 },
      { item: 'Mensalidade iFood', valor: -100.00 },
      { item: 'Total', valor: -2558.27 },
    ],
    promocoes: [
      { item: 'Promoções incentivadas pela loja', pedidos: 168, valor: -839.58 },
      { item: 'Total', valor: -839.58 },
    ],
    servicos: [
      { item: 'Pacote de anúncios', valor: -609.84 },
      { item: 'Total', valor: -609.84 },
    ],
    ajustes: [
      { item: 'Reembolso da taxa de serviço cobrada do cliente', pedidos: 28, valor: 0.87 },
      { item: 'Total', valor: 0.87 },
    ],
    faturamento: [
      { item: 'Valores recebidos direto pela loja', pedidos: 38, valor: 2711.55 },
      { item: 'Valor dos repasses', valor: 10894.03 },
      { item: 'Total', valor: 13605.58 },
    ],
  }),
  mkRows('2026-04-01', 'lanches', {
    vendas: [
      { item: 'Valor dos itens e entrega própria da loja', valor: 12348.20 },
      { item: 'Total', valor: 12348.20 },
    ],
    taxas_comissoes: [
      { item: 'Taxa de transação de pagamento online', pedidos: 139, valor: -322.52 },
      { item: 'Comissão iFood - entrega própria', pedidos: 130, valor: -1195.65 },
      { item: 'Comissão iFood - pedidos pra retirar', pedidos: 29, valor: -216.88 },
      { item: 'Mensalidade iFood', valor: -100.00 },
      { item: 'Total', valor: -1835.05 },
    ],
    promocoes: [
      { item: 'Promoções incentivadas pela loja', pedidos: 117, valor: -579.86 },
      { item: 'Total', valor: -579.86 },
    ],
    servicos: [{ item: 'Total', valor: 0.00 }],
    ajustes: [
      { item: 'Reembolso da taxa de serviço cobrada do cliente', pedidos: 16, valor: 0.57 },
      { item: 'Crédito - Taxa de transação de pagamento online', pedidos: 3, valor: 8.93 },
      { item: 'Total', valor: 9.50 },
    ],
    faturamento: [
      { item: 'Valores recebidos direto pela loja', pedidos: 23, valor: 1874.61 },
      { item: 'Valor dos repasses', valor: 8068.18 },
      { item: 'Total', valor: 9942.79 },
    ],
  }),
  mkRows('2026-05-01', 'lanches', {
    vendas: [
      { item: 'Valor dos itens e entrega própria da loja', valor: 17049.80 },
      { item: 'Cancelamentos', pedidos: 1, valor: -5.00 },
      { item: 'Total', valor: 17044.80 },
    ],
    taxas_comissoes: [
      { item: 'Comissão iFood - entrega própria', pedidos: 194, valor: -1653.16 },
      { item: 'Taxa de transação de pagamento online', pedidos: 194, valor: -428.11 },
      { item: 'Comissão iFood - pedidos pra retirar', pedidos: 37, valor: -278.71 },
      { item: 'Reembolso da Comissão iFood - entrega parceira', valor: 0.60 },
      { item: 'Mensalidade iFood', valor: -100.00 },
      { item: 'Total', valor: -2459.38 },
    ],
    promocoes: [
      { item: 'Promoções incentivadas pela loja', pedidos: 192, valor: -954.59 },
      { item: 'Total', valor: -954.59 },
    ],
    servicos: [{ item: 'Total', valor: 0.00 }],
    ajustes: [
      { item: 'Reembolso da taxa de serviço cobrada do cliente', pedidos: 26, valor: 1.03 },
      { item: 'Total', valor: 1.03 },
    ],
    faturamento: [
      { item: 'Valores recebidos direto pela loja', pedidos: 37, valor: 2574.38 },
      { item: 'Valor dos repasses', valor: 11057.48 },
      { item: 'Total', valor: 13631.86 },
    ],
  }),
  mkRows('2026-06-01', 'lanches', {
    vendas: [
      { item: 'Valor dos itens e entrega própria da loja', valor: 21797.10 },
      { item: 'Total', valor: 21797.10 },
    ],
    taxas_comissoes: [
      { item: 'Taxa de transação de pagamento online', pedidos: 260, valor: -543.86 },
      { item: 'Comissão iFood - entrega própria', pedidos: 300, valor: -2357.72 },
      { item: 'Comissão iFood - pedidos pra retirar', pedidos: 15, valor: -104.45 },
      { item: 'Mensalidade iFood', valor: -107.34 },
      { item: 'Total', valor: -3113.37 },
    ],
    promocoes: [
      { item: 'Promoções incentivadas pela loja', pedidos: 259, valor: -1284.55 },
      { item: 'Total', valor: -1284.55 },
    ],
    servicos: [
      { item: 'Pacote de anúncios', valor: -295.71 },
      { item: 'Total', valor: -295.71 },
    ],
    ajustes: [
      { item: 'Reembolso da taxa de serviço cobrada do cliente', pedidos: 40, valor: 1.56 },
      { item: 'Total', valor: 1.56 },
    ],
    faturamento: [
      { item: 'Valores recebidos direto pela loja', pedidos: 55, valor: 3366.04 },
      { item: 'Valor dos repasses', valor: 13738.99 },
      { item: 'Total', valor: 17105.03 },
    ],
  }),
  mkRows('2026-07-01', 'lanches', {
    vendas: [
      { item: 'Valor dos itens e entrega própria da loja', valor: 20965.90 },
      { item: 'Cancelamentos', pedidos: 1, valor: -6.00 },
      { item: 'Total', valor: 20959.90 },
    ],
    taxas_comissoes: [
      { item: 'Comissão iFood - entrega própria', pedidos: 297, valor: -2284.15 },
      { item: 'Comissão iFood - pedidos pra retirar', pedidos: 10, valor: -80.46 },
      { item: 'Taxa de transação de pagamento online', pedidos: 264, valor: -540.32 },
      { item: 'Mensalidade iFood', valor: -110.00 },
      { item: 'Reembolso da Comissão iFood - entrega parceira', valor: 0.72 },
      { item: 'Total', valor: -3014.21 },
    ],
    promocoes: [
      { item: 'Promoções incentivadas pela loja', pedidos: 253, valor: -1264.30 },
      { item: 'Total', valor: -1264.30 },
    ],
    servicos: [
      { item: 'Pacote de anúncios', valor: -608.56 },
      { item: 'Total', valor: -608.56 },
    ],
    ajustes: [
      { item: 'Reembolso da taxa de serviço cobrada do cliente', pedidos: 28, valor: 1.18 },
      { item: 'Total', valor: 1.18 },
    ],
    faturamento: [
      { item: 'Valores recebidos direto pela loja', pedidos: 43, valor: 2686.25 },
      { item: 'Valor dos repasses', valor: 13387.76 },
      { item: 'Total', valor: 16074.01 },
    ],
  }),
].flat();

const ifoodRows = [...pratos, ...lanches];

// ---------- Taxas de adquirente ----------

// vigente_desde fixo (nao o default current_date) -- senao rodar o script
// em dias diferentes cria linha nova toda vez em vez de atualizar a mesma.
const VIGENTE_DESDE_PADRAO = '2026-08-04';

const taxas = [
  { adquirente: 'Getnet', modalidade: 'Débito Visa/Master', taxa_pct: 0.75 },
  { adquirente: 'Getnet', modalidade: 'Crédito Visa/Master', taxa_pct: 1.75 },
  { adquirente: 'Getnet', modalidade: 'Débito Elo', taxa_pct: 1.05 },
  { adquirente: 'Getnet', modalidade: 'Crédito Elo', taxa_pct: 2.05 },
  { adquirente: 'Getnet', modalidade: 'Crédito Amex', taxa_pct: 2.75 },
  { adquirente: 'Getnet', modalidade: 'Alelo Refeição (estimado, confirmar)', taxa_pct: 6.0 },
  { adquirente: 'Getnet', modalidade: 'Sodexo (estimado, confirmar)', taxa_pct: 6.0 },
  { adquirente: 'Getnet', modalidade: 'Pluxe (estimado, confirmar)', taxa_pct: 6.0 },
  { adquirente: 'Banricompras', modalidade: 'Débito', taxa_pct: 1.29 },
  { adquirente: 'Banricompras', modalidade: 'Pré-datado', taxa_pct: 2.29 },
  { adquirente: 'Banricompras', modalidade: 'Débito Master/Visa', taxa_pct: 1.39 },
  { adquirente: 'Banricompras', modalidade: 'Crédito Master/Visa', taxa_pct: 2.39 },
  { adquirente: 'Banricompras', modalidade: 'Débito Elo', taxa_pct: 1.49 },
  { adquirente: 'Banricompras', modalidade: 'Crédito Elo', taxa_pct: 2.59 },
  { adquirente: 'Banricompras', modalidade: 'Pix', taxa_pct: 0.99 },
  { adquirente: 'Banricompras', modalidade: 'Banricard Alimentação/Refeição', taxa_pct: 3.60 },
  { adquirente: 'Verdecard', modalidade: 'Débito', taxa_pct: 1.99 },
  { adquirente: 'Verdecard', modalidade: 'Crédito', taxa_pct: 4.00 },
  { adquirente: 'Sicredi', modalidade: 'Pix', taxa_pct: 0.0 },
].map((t) => ({ ...t, vigente_desde: VIGENTE_DESDE_PADRAO }));

async function main() {
  console.log(`Inserindo ${ifoodRows.length} linhas de ifood_mensal...`);
  const { error: errIfood } = await supabase.from('ifood_mensal').upsert(ifoodRows, {
    onConflict: 'mes_referencia,loja,categoria,item',
  });
  if (errIfood) throw errIfood;
  console.log('ifood_mensal ok.');

  console.log(`Inserindo ${taxas.length} linhas de taxas_adquirente...`);
  const { error: errTaxas } = await supabase.from('taxas_adquirente').upsert(taxas, {
    onConflict: 'adquirente,modalidade,vigente_desde',
  });
  if (errTaxas) throw errTaxas;
  console.log('taxas_adquirente ok.');
}

main().catch((err) => {
  console.error('Erro:', err.message, err.details || '');
  process.exit(1);
});
