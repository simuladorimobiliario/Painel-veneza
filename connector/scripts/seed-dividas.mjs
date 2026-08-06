import { getSupabase } from '../src/supabaseClient.js';

const supabase = getSupabase();

// Contexto passado pelo Fernando em 2026-08-05 (nao vem de nenhum sistema
// sincronizado -- ver memoria veneza_business_context.md).
const dividas = [
  {
    nome: 'Santander Giro',
    parcela_atual: 9,
    parcelas_totais: 42,
    valor_parcela_min: 3259.14,
    valor_parcela_max: 3259.14,
    data_primeira_parcela: null,
    coobrigados: null,
    observacao: 'Rodando em paralelo ao Sicredi.',
    ativa: true,
  },
  {
    nome: 'Banrisul Pronampe',
    parcela_atual: 28,
    parcelas_totais: 42,
    valor_parcela_min: 3000.0,
    valor_parcela_max: 3000.0,
    data_primeira_parcela: null,
    coobrigados: null,
    observacao: 'Valor aproximado (~R$3.000/mês). Um segundo Pronampe Banrisul (R$5.512/mês) foi encerrado em jul/2026.',
    ativa: true,
  },
  {
    nome: 'Sicredi Pronampe',
    parcela_atual: 0,
    parcelas_totais: 60,
    valor_parcela_min: 4200.0,
    valor_parcela_max: 8300.0,
    data_primeira_parcela: '2027-06-01',
    coobrigados: 'Wagner (sócio), esposa do Fernando, esposa do Wagner',
    observacao:
      'Contrato assinado 05/06/2026, R$250.000, SAC, carência ~1 ano. Taxa Selic + 6% a.a. capitalizada mensalmente ' +
      '(risco de taxa variável). 1ª parcela entre R$7.400 e R$8.300 dependendo da Selic, caindo até ~R$4.200-4.300 no ' +
      'fim. Usado também pra quitar dívida antiga de R$182k (parcela R$9.139/mês), impostos atrasados, devolução de ' +
      'valor emprestado pela esposa do Fernando, e atrasados de folha/pró-labore.',
    ativa: true,
  },
];

async function main() {
  console.log(`Inserindo ${dividas.length} dívidas...`);
  const { error } = await supabase.from('dividas').insert(dividas);
  if (error) throw error;
  console.log('dividas ok.');
}

main().catch((err) => {
  console.error('Erro:', err.message, err.details || '');
  process.exit(1);
});
