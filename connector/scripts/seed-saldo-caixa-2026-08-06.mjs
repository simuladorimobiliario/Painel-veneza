import { getSupabase } from '../src/supabaseClient.js';

const supabase = getSupabase();

// Saldo de ABERTURA do dia 06/08/2026 (antes dos pagamentos do dia), conforme
// Fernando passou no chat. Nesse mesmo dia faltou R$28.400 pra fechar os
// pagamentos e foi feita antecipacao de cartao pra cobrir -- ver observacao.
const DATA = '2026-08-06';
const linhas = [
  { data_referencia: DATA, conta: 'Santander', valor: 2524.72 },
  { data_referencia: DATA, conta: 'Banrisul', valor: 3885.92 },
  { data_referencia: DATA, conta: 'Sicredi', valor: 533.6 },
  {
    data_referencia: DATA,
    conta: 'Caixa',
    valor: 2636.0,
    observacao:
      'Mesmo com esse saldo de abertura, faltou R$28.400 pra fechar os pagamentos do dia -- foi antecipado ' +
      'R$31.535,88 de cartao (de um possivel de R$40.711,92), custando R$422,91 de taxa.',
  },
];

async function main() {
  console.log(`Inserindo saldo_caixa de ${DATA} (${linhas.length} contas)...`);
  const { error } = await supabase.from('saldo_caixa').insert(linhas);
  if (error) throw error;
  console.log('saldo_caixa ok.');
}

main().catch((err) => {
  console.error('Erro:', err.message, err.details || '');
  process.exit(1);
});
