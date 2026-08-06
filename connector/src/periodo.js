// Resolve o periodo de busca a partir dos argumentos de linha de comando.
// --de=YYYY-MM-DD --ate=YYYY-MM-DD tem prioridade (janela historica fixa);
// sem eles, cai no comportamento antigo de --dias=N contados a partir de hoje.
export function resolverPeriodo(args, diasPadrao = 7) {
  const de = args.find((a) => a.startsWith('--de='))?.split('=')[1];
  const ate = args.find((a) => a.startsWith('--ate='))?.split('=')[1];

  if (de && ate) {
    return { ini: new Date(`${de}T00:00:00`), fim: new Date(`${ate}T00:00:00`) };
  }

  const dias = Number(args.find((a) => a.startsWith('--dias='))?.split('=')[1]) || diasPadrao;
  const fim = new Date();
  const ini = new Date(fim.getTime() - dias * 24 * 60 * 60 * 1000);
  return { ini, fim };
}
