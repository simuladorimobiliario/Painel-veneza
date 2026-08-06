import { consulta } from './apiMemoriaClient.js';

const padrao = process.argv[2];
if (!padrao) {
  console.error('Uso: node src/findTables.js PADRAO (ex: %ITEM%, %CUSTO%)');
  process.exit(1);
}

// Busca tabelas de usuario (exclui as de sistema do Firebird) por padrao LIKE.
const sql = `
  select
    r.rdb$relation_name as NOME,
    r.rdb$system_flag as SISTEMA
  from rdb$relations r
  where r.rdb$relation_name like :sPadrao
    and r.rdb$view_blr is null
    and (r.rdb$system_flag = 0 or r.rdb$system_flag is null)
  order by r.rdb$relation_name
`;

const { rows } = await consulta(sql, { SPADRAO: padrao.toUpperCase() }, { limit: 200 });

if (rows.length === 0) {
  console.log(`Nenhuma tabela encontrada para "${padrao}".`);
  process.exit(0);
}

console.log(`Tabelas encontradas para "${padrao}":\n`);
for (const row of rows) {
  console.log(`  ${String(row.NOME).trim()}`);
}
