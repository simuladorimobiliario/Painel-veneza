import { getSupabase } from '../src/supabaseClient.js';

const supabase = getSupabase();

// Extraido dos PDFs de DRE que o Fernando exportou do Memoria Info (jan-abr
// 2026). Fevereiro, marco e abril nao vinham com "TARIFAS IFOOD" (custos
// variaveis) nem "CUPONS E CAMPANHAS IFOOD" (marketing) -- adicionamos esses
// dois usando o total real do relatorio do iFood (tabela ifood_mensal:
// taxas_comissoes = Tarifas iFood, servicos = Cupons e Campanhas iFood), e
// recalculamos em cascata Margem de Contribuicao Bruta / EBITDA / Resultado
// Operacional / Resultado Liquido a partir dai. Janeiro ja veio correto no
// PDF original (conferido: bate exato com o total do iFood daquele mes), por
// isso nao precisou de ajuste.
//
// Valores guardados como magnitude positiva pras categorias de custo/despesa
// (é como aparece no PDF, o "(-)" é so indicador visual) -- so a categoria
// "resultado" guarda valor com sinal de verdade, porque resultado liquido
// pode ser negativo.

function mkRows(mes, secoes) {
  const rows = [];
  for (const [categoria, itens] of Object.entries(secoes)) {
    for (const item of itens) {
      rows.push({ mes_referencia: mes, categoria, item: item.item, valor: item.valor });
    }
  }
  return rows;
}

const janeiro = mkRows('2026-01-01', {
  receita: [{ item: 'Receita de Vendas', valor: 292179.80 }],
  impostos: [{ item: 'Simples/ICMS', valor: 21477.55 }],
  materia_prima: [
    { item: 'Compra de Insumos', valor: 85296.09 },
    { item: 'Bebidas/Chocolates/Doces/Picolés/Polpas', valor: 19634.12 },
    { item: 'Embalagens Pratos e Lanches', valor: 2597.00 },
  ],
  custos_variaveis: [
    { item: 'Tele Entrega', valor: 13464.00 },
    { item: 'Tarifas iFood', valor: 11356.37 },
    { item: 'Taxas de Cartão', valor: 792.30 },
  ],
  pessoal: [
    { item: 'Salários', valor: 37630.71 },
    { item: 'Salários Extras - Funcionários Temporários (Garçons)', valor: 9365.00 },
    { item: 'Pró-labore Sócios', valor: 23150.00 },
    { item: 'Transporte Garupa', valor: 2178.67 },
    { item: 'Vale Transporte', valor: 1314.00 },
    { item: 'INSS', valor: 3918.57 },
    { item: 'FGTS', valor: 3227.72 },
    { item: 'Sindicato', valor: 578.66 },
    { item: 'Medicina do Trabalho', valor: 356.78 },
    { item: 'Férias', valor: 2346.43 },
  ],
  despesas_operacionais: [
    { item: 'Energia Elétrica', valor: 1956.19 },
    { item: 'Gás', valor: 2844.32 },
    { item: 'Água', valor: 1951.47 },
    { item: 'Aluguel', valor: 12777.77 },
    { item: 'Manutenção', valor: 3128.72 },
    { item: 'Material de Limpeza', valor: 5022.49 },
    { item: 'Seguros', valor: 529.44 },
    { item: 'Sistema', valor: 1453.01 },
    { item: 'Net/Internet', valor: 747.46 },
    { item: 'Embalagens e Descartáveis', valor: 3394.94 },
    { item: 'Utensílios Trocas', valor: 322.10 },
    { item: 'Material de Escritório', valor: 272.32 },
    { item: 'Manutenção de Contas Bancárias', valor: 47.50 },
  ],
  marketing: [
    { item: 'Cupons e Campanhas iFood', valor: 587.94 },
    { item: 'Propaganda/Tráfego', valor: 378.19 },
    { item: 'Material Publicitário', valor: 1324.86 },
  ],
  servicos_terceiros: [
    { item: 'Contador', valor: 3900.00 },
    { item: 'Dedetização', valor: 405.81 },
  ],
  gastos_nao_operacionais: [
    { item: 'Aquisição de Equipamentos/Itens', valor: 4103.74 },
    { item: 'Parcelamento de Impostos/Restituição de Imposto', valor: 5898.31 },
  ],
  investimentos: [
    { item: 'Consultorias e Mentorias', valor: 565.34 },
    { item: 'Títulos de Capitalização', valor: 246.56 },
    { item: 'Empréstimos', valor: 21071.78 },
  ],
  resultado: [
    { item: 'Receita Líquida', valor: 270702.25 },
    { item: 'Margem de Contribuição Bruta', valor: 137562.37 },
    { item: 'EBITDA', valor: 12451.30 },
    { item: 'Resultado Operacional', valor: 2449.25 },
    { item: 'Resultado Líquido', valor: -19434.43 },
  ],
});

const fevereiro = mkRows('2026-02-01', {
  receita: [{ item: 'Receita de Vendas', valor: 282626.59 }],
  impostos: [{ item: 'Simples/ICMS', valor: 20157.07 }],
  materia_prima: [
    { item: 'Compra de Insumos', valor: 79313.41 },
    { item: 'Bebidas/Chocolates/Doces/Picolés/Polpas', valor: 19949.35 },
    { item: 'Embalagens Pratos e Lanches', valor: 5278.00 },
  ],
  custos_variaveis: [
    { item: 'Tele Entrega', valor: 14916.00 },
    { item: 'Taxas de Cartão', valor: 1268.60 },
    { item: 'Tarifas iFood', valor: 13138.31 },
  ],
  pessoal: [
    { item: 'Salários', valor: 34614.51 },
    { item: 'Salários Extras - Funcionários Temporários (Garçons)', valor: 9215.00 },
    { item: 'Pró-labore Sócios', valor: 23150.00 },
    { item: 'Transporte Garupa', valor: 1925.80 },
    { item: 'Vale Transporte', valor: 1182.00 },
    { item: 'INSS', valor: 3880.05 },
    { item: 'FGTS', valor: 2264.24 },
    { item: 'Uniformes', valor: 106.10 },
    { item: 'Sindicato', valor: 246.35 },
    { item: 'Medicina do Trabalho', valor: 287.31 },
    { item: 'Férias', valor: 3354.91 },
  ],
  despesas_operacionais: [
    { item: 'Energia Elétrica', valor: 1924.17 },
    { item: 'Gás', valor: 2109.08 },
    { item: 'Água', valor: 2254.54 },
    { item: 'Aluguel', valor: 13694.01 },
    { item: 'Manutenção', valor: 3457.69 },
    { item: 'Material de Limpeza', valor: 2162.89 },
    { item: 'Seguros', valor: 529.44 },
    { item: 'Sistema', valor: 1086.55 },
    { item: 'DARF', valor: 112.67 },
    { item: 'Net/Internet', valor: 747.46 },
    { item: 'Embalagens e Descartáveis', valor: 286.62 },
    { item: 'Utensílios Trocas', valor: 287.39 },
    { item: 'Material de Escritório', valor: 174.00 },
    { item: 'Manutenção de Contas Bancárias', valor: 141.49 },
  ],
  marketing: [
    { item: 'Propaganda/Tráfego', valor: 109.38 },
    { item: 'Material Publicitário', valor: 169.90 },
    { item: 'Agência de Marketing', valor: 1100.00 },
    { item: 'Cupons e Campanhas iFood', valor: 2476.11 },
  ],
  servicos_terceiros: [
    { item: 'Contador', valor: 2090.00 },
    { item: 'Segurança', valor: 443.11 },
    { item: 'Dedetização', valor: 405.81 },
  ],
  gastos_nao_operacionais: [
    { item: 'Aquisição de Equipamentos/Itens', valor: 1880.09 },
    { item: 'Parcelamento de Impostos/Restituição de Imposto', valor: 5956.73 },
  ],
  investimentos: [
    { item: 'Consultorias e Mentorias', valor: 568.82 },
    { item: 'Títulos de Capitalização', valor: 246.56 },
    { item: 'Empréstimos', valor: 15380.99 },
  ],
  resultado: [
    { item: 'Receita Líquida', valor: 262469.52 },
    { item: 'Margem de Contribuição Bruta', valor: 128605.85 },
    { item: 'EBITDA', valor: 12617.27 },
    { item: 'Resultado Operacional', valor: 4780.45 },
    { item: 'Resultado Líquido', valor: -11415.92 },
  ],
});

const marco = mkRows('2026-03-01', {
  receita: [{ item: 'Receita de Vendas', valor: 322926.97 }],
  impostos: [{ item: 'Simples/ICMS', valor: 21824.80 }],
  materia_prima: [
    { item: 'Compra de Insumos', valor: 89097.29 },
    { item: 'Bebidas/Chocolates/Doces/Picolés/Polpas', valor: 22674.04 },
    { item: 'Embalagens Pratos e Lanches', valor: 3578.00 },
  ],
  custos_variaveis: [
    { item: 'Tele Entrega', valor: 14916.00 },
    { item: 'Taxas de Cartão', valor: 668.04 },
    { item: 'Tarifas iFood', valor: 14913.08 },
  ],
  pessoal: [
    { item: 'Salários', valor: 30932.65 },
    { item: 'Salários Extras - Funcionários Temporários (Garçons)', valor: 14879.00 },
    { item: 'Pró-labore Sócios', valor: 23150.00 },
    { item: 'Transporte Garupa', valor: 2165.70 },
    { item: 'Vale Transporte', valor: 708.00 },
    { item: 'INSS', valor: 3533.23 },
    { item: 'FGTS', valor: 2357.22 },
    { item: 'Uniformes', valor: 162.12 },
    { item: 'Sindicato', valor: 246.35 },
    { item: 'Medicina do Trabalho', valor: 318.51 },
    { item: 'Férias', valor: 2665.66 },
  ],
  despesas_operacionais: [
    { item: 'Energia Elétrica', valor: 1857.68 },
    { item: 'Gás', valor: 5641.29 },
    { item: 'Água', valor: 1681.70 },
    { item: 'Aluguel', valor: 14260.80 },
    { item: 'Manutenção', valor: 4167.67 },
    { item: 'Material de Limpeza', valor: 4211.94 },
    { item: 'Seguros', valor: 529.44 },
    { item: 'Sistema', valor: 1086.55 },
    { item: 'Net/Internet', valor: 747.46 },
    { item: 'Embalagens e Descartáveis', valor: 3138.95 },
    { item: 'Utensílios Trocas', valor: 233.37 },
    { item: 'Material de Escritório', valor: 339.33 },
    { item: 'Manutenção de Contas Bancárias', valor: 119.00 },
  ],
  marketing: [
    { item: 'Material Publicitário', valor: 78.30 },
    { item: 'Agência de Marketing', valor: 1100.00 },
    { item: 'Cupons e Campanhas iFood', valor: 3413.58 },
  ],
  servicos_terceiros: [
    { item: 'Contador', valor: 2090.00 },
    { item: 'Segurança', valor: 348.54 },
    { item: 'Dedetização', valor: 405.81 },
  ],
  gastos_nao_operacionais: [
    { item: 'Aquisição de Equipamentos/Itens', valor: 1606.84 },
    { item: 'Parcelamento de Impostos/Restituição de Imposto', valor: 6007.09 },
  ],
  investimentos: [
    { item: 'Consultorias e Mentorias', valor: 198.17 },
    { item: 'Títulos de Capitalização', valor: 546.56 },
    { item: 'Empréstimos', valor: 26782.16 },
  ],
  resultado: [
    { item: 'Receita Líquida', valor: 301102.17 },
    { item: 'Margem de Contribuição Bruta', valor: 155255.72 },
    { item: 'EBITDA', valor: 28685.87 },
    { item: 'Resultado Operacional', valor: 21071.94 },
    { item: 'Resultado Líquido', valor: -6454.95 },
  ],
});

const abril = mkRows('2026-04-01', {
  receita: [{ item: 'Receita de Vendas', valor: 312785.90 }],
  impostos: [{ item: 'Simples/ICMS', valor: 24461.44 }],
  materia_prima: [
    { item: 'Compra de Insumos', valor: 79006.22 },
    { item: 'Bebidas/Chocolates/Doces/Picolés/Polpas', valor: 22334.45 },
    { item: 'Embalagens Pratos e Lanches', valor: 10416.30 },
  ],
  custos_variaveis: [
    { item: 'Tele Entrega', valor: 16812.00 },
    { item: 'Taxas de Cartão', valor: 1255.62 },
    { item: 'Tarifas iFood', valor: 11939.31 },
  ],
  pessoal: [
    { item: 'Salários', valor: 36915.91 },
    { item: 'Salários Extras - Funcionários Temporários (Garçons)', valor: 9652.00 },
    { item: 'Pró-labore Sócios', valor: 23150.00 },
    { item: 'Transporte Garupa', valor: 1846.91 },
    { item: 'Vale Transporte', valor: 900.00 },
    { item: 'Rescisões', valor: 3334.56 },
    { item: 'INSS', valor: 3588.82 },
    { item: 'FGTS', valor: 2382.88 },
    { item: 'Sindicato', valor: 246.35 },
    { item: 'Medicina do Trabalho', valor: 278.51 },
  ],
  despesas_operacionais: [
    { item: 'Energia Elétrica', valor: 1985.94 },
    { item: 'Gás', valor: 2719.17 },
    { item: 'Água', valor: 1742.67 },
    { item: 'Aluguel', valor: 13782.60 },
    { item: 'Manutenção', valor: 6123.98 },
    { item: 'Material de Limpeza', valor: 1988.03 },
    { item: 'Seguros', valor: 211.35 },
    { item: 'Sistema', valor: 1086.55 },
    { item: 'Net/Internet', valor: 770.80 },
    { item: 'Embalagens e Descartáveis', valor: 1353.97 },
    { item: 'Utensílios Trocas', valor: 453.57 },
    { item: 'Material de Escritório', valor: 777.17 },
    { item: 'Manutenção de Contas Bancárias', valor: 127.75 },
  ],
  marketing: [
    { item: 'Material Publicitário', valor: 84.90 },
    { item: 'Agência de Marketing', valor: 1100.00 },
    { item: 'Cupons e Campanhas iFood', valor: 328.59 },
  ],
  servicos_terceiros: [
    { item: 'Contador', valor: 2090.00 },
    { item: 'Segurança', valor: 442.46 },
    { item: 'Dedetização', valor: 405.81 },
  ],
  gastos_nao_operacionais: [
    { item: 'Comissão', valor: 660.00 },
    { item: 'Aquisição de Equipamentos/Itens', valor: 1556.64 },
    { item: 'Parcelamento de Impostos/Restituição de Imposto', valor: 6068.03 },
  ],
  investimentos: [
    { item: 'Consultorias e Mentorias', valor: 198.17 },
    { item: 'Títulos de Capitalização', valor: 396.56 },
    { item: 'Empréstimos', valor: 20406.55 },
  ],
  resultado: [
    { item: 'Receita Líquida', valor: 288324.46 },
    { item: 'Margem de Contribuição Bruta', valor: 146560.56 },
    { item: 'EBITDA', valor: 26689.31 },
    { item: 'Resultado Operacional', valor: 18404.64 },
    { item: 'Resultado Líquido', valor: -2596.64 },
  ],
});

// Maio: SIMPLES/ICMS veio R$91,37 no PDF (normal seria ~7% = ~R$21k) porque
// o imposto de maio foi pago com atraso em 09/06 (R$26.466,95) -- o sistema
// lanca despesa por CAIXA (data do pagamento), nao por competencia, entao
// esse valor real vai aparecer no DRE de JUNHO, nao no de maio. Mantido
// como o PDF reportou (fiel ao que foi de fato pago em maio); a distorcao
// fica documentada aqui e na memoria do projeto, nao "corrigida" — corrigir
// exigiria reclassificar por competencia, o que muda o criterio combinado
// com o Fernando (despesa = data de pagamento, receita = data de venda).
const maio = mkRows('2026-05-01', {
  receita: [{ item: 'Receita de Vendas', valor: 300146.77 }],
  impostos: [{ item: 'Simples/ICMS', valor: 91.37 }],
  materia_prima: [
    { item: 'Compra de Insumos', valor: 95563.10 },
    { item: 'Bebidas/Chocolates/Doces/Picolés/Polpas', valor: 21331.38 },
    { item: 'Embalagens Pratos e Lanches', valor: 3394.70 },
  ],
  custos_variaveis: [
    { item: 'Tele Entrega', valor: 15936.00 },
    { item: 'Taxas de Cartão', valor: 1541.46 },
    { item: 'Tarifas iFood', valor: 12851.37 },
  ],
  pessoal: [
    { item: 'Salários', valor: 37654.53 },
    { item: 'Salários Extras - Funcionários Temporários (Garçons)', valor: 7040.00 },
    { item: 'Pró-labore Sócios', valor: 13150.00 },
    { item: 'Transporte Garupa', valor: 2286.49 },
    { item: 'Vale Transporte', valor: 1488.00 },
    { item: 'INSS', valor: 3970.97 },
    { item: 'FGTS', valor: 2639.14 },
    { item: 'Sindicato', valor: 265.30 },
    { item: 'Medicina do Trabalho', valor: 358.51 },
  ],
  despesas_operacionais: [
    { item: 'Energia Elétrica', valor: 1510.24 },
    { item: 'Gás', valor: 5386.24 },
    { item: 'Água', valor: 1783.15 },
    { item: 'Aluguel', valor: 12826.20 },
    { item: 'Manutenção', valor: 2910.53 },
    { item: 'Material de Limpeza', valor: 4383.97 },
    { item: 'Seguros', valor: 211.35 },
    { item: 'Sistema', valor: 1101.55 },
    { item: 'DARF', valor: 232.55 },
    { item: 'Net/Internet', valor: 783.16 },
    { item: 'Embalagens e Descartáveis', valor: 2953.28 },
    { item: 'Utensílios Trocas', valor: 326.68 },
    { item: 'Material de Escritório', valor: 38.00 },
    { item: 'Manutenção de Contas Bancárias', valor: 56.50 },
  ],
  marketing: [
    { item: 'Material Publicitário', valor: 84.90 },
    { item: 'Agência de Marketing', valor: 1100.00 },
    // Cupons e Campanhas iFood = R$0 em maio pras duas lojas (sem pacote de
    // anuncios contratado esse mes) -- nao entra linha, nao muda o total.
  ],
  servicos_terceiros: [
    { item: 'Contador', valor: 2090.00 },
    { item: 'Segurança', valor: 377.19 },
    { item: 'Dedetização', valor: 422.61 },
  ],
  gastos_nao_operacionais: [
    { item: 'Comissão', valor: 100.00 },
    { item: 'Aquisição de Equipamentos/Itens', valor: 1556.68 },
    { item: 'Parcelamento de Impostos/Restituição de Imposto', valor: 6122.92 },
  ],
  investimentos: [
    { item: 'Consultorias e Mentorias', valor: 395.17 },
    { item: 'Títulos de Capitalização', valor: 396.56 },
    { item: 'Reformas', valor: 203.88 },
    { item: 'Empréstimos', valor: 20220.27 },
  ],
  resultado: [
    { item: 'Receita Líquida', valor: 300055.40 },
    { item: 'Margem de Contribuição Bruta', valor: 149437.39 },
    { item: 'EBITDA', valor: 42006.35 },
    { item: 'Resultado Operacional', valor: 34226.75 },
    { item: 'Resultado Líquido', valor: 13010.87 },
  ],
});

const rows = [...janeiro, ...fevereiro, ...marco, ...abril, ...maio];

async function main() {
  console.log(`Inserindo ${rows.length} linhas de dre_mensal...`);
  const { error } = await supabase.from('dre_mensal').upsert(rows, {
    onConflict: 'mes_referencia,categoria,item',
  });
  if (error) throw error;
  console.log('dre_mensal ok.');
}

main().catch((err) => {
  console.error('Erro:', err.message, err.details || '');
  process.exit(1);
});
