import { getSupabase } from '../src/supabaseClient.js';

const supabase = getSupabase();

const registro = {
  data_referencia: '2026-08-06',
  valor_antecipado: 31535.88,
  valor_possivel: 40711.92,
  taxa_paga: 422.91,
  observacao: 'Faltou R$28.400 pra fechar os pagamentos do dia mesmo com o saldo de abertura das contas.',
};

async function main() {
  console.log('Inserindo antecipacao de 2026-08-06...');
  const { error } = await supabase.from('antecipacoes').insert(registro);
  if (error) throw error;
  console.log('antecipacoes ok.');
}

main().catch((err) => {
  console.error('Erro:', err.message, err.details || '');
  process.exit(1);
});
