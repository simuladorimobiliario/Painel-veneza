import { getSupabase } from '../src/supabaseClient.js';

const supabase = getSupabase();

// Registro pontual (nao e sync automatico) -- Fernando confirmou 2026-08-05
// que a reserva esta zerada: sem nada guardado, ainda usando o proprio
// fluxo de caixa e antecipando recebiveis (pagando taxa de antecipacao) em
// vez de ja estar formando o colchao pro salto de divida de jun/2027.
const registro = {
  data_referencia: '2026-08-05',
  valor: 0,
  observacao:
    'Reserva zerada. Ainda usando o proprio fluxo de caixa pra operar e antecipando recebiveis ' +
    '(pagando taxa de antecipacao), em vez de estar acumulando o colchao pro salto de divida de jun/2027.',
};

async function main() {
  console.log('Inserindo registro de reserva...');
  const { error } = await supabase.from('reserva_saldo').insert(registro);
  if (error) throw error;
  console.log('reserva_saldo ok.');
}

main().catch((err) => {
  console.error('Erro:', err.message, err.details || '');
  process.exit(1);
});
