const TAMANHO_PAGINA = 1000; // limite padrao de linhas por request do Supabase

// makeQuery deve retornar um query builder NOVO a cada chamada (sem await),
// pois um builder ja executado nao pode ser reutilizado pra pedir a proxima pagina.
export async function fetchAll(makeQuery, pageSize = TAMANHO_PAGINA) {
  let todas = [];
  let from = 0;

  for (;;) {
    const { data, error } = await makeQuery().range(from, from + pageSize - 1);
    if (error) return { data: null, error };
    todas = todas.concat(data);
    if (!data || data.length < pageSize) break;
    from += pageSize;
  }

  return { data: todas, error: null };
}
