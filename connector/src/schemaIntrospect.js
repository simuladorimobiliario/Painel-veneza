import { consulta } from './apiMemoriaClient.js';

const tabela = process.argv[2];
if (!tabela) {
  console.error('Uso: node src/schemaIntrospect.js NOME_DA_TABELA');
  process.exit(1);
}

// Projeta 2 colunas (nao 1) para evitar a armadilha do array-de-escalares.
const sql = `
  select rf.rdb$field_name as CAMPO, rf.rdb$field_position as POSICAO
  from rdb$relation_fields rf
  where rf.rdb$relation_name = :sTabela
  order by rf.rdb$field_position
`;

// RDB$RELATION_NAME fica gravado em maiusculo no catalogo do Firebird.
const { rows } = await consulta(sql, { STABELA: tabela.toUpperCase() }, { limit: 500 });

if (rows.length === 0) {
  console.log(`Nenhum campo encontrado para "${tabela}". Confira o nome exato da tabela.`);
  process.exit(0);
}

console.log(`Campos de ${tabela.toUpperCase()}:\n`);
for (const row of rows) {
  // Campos CHAR do Firebird vem com padding de espaco.
  console.log(`  ${String(row.POSICAO).padStart(3)}  ${String(row.CAMPO).trim()}`);
}
