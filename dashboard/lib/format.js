const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const dateFormatter = new Intl.DateTimeFormat('pt-BR');

export function formatBRL(valor) {
  return currencyFormatter.format(valor ?? 0);
}

export function formatDataBR(iso) {
  if (!iso) return '-';
  return dateFormatter.format(new Date(`${iso}T00:00:00`));
}
