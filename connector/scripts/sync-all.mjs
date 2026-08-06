import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Roda todos os syncs em sequencia -- pensado pra ser chamado pelo Task
// Scheduler do Windows de hora em hora. Janela curta (--dias=3) pra
// vendas/recebimentos/itens_venda: cobre atraso de sincronizacao sem pesar
// na API do Memoria Info a cada execucao. Contas a pagar usa a janela padrao
// do proprio script (30 dias atras + 60 dias a frente), que e uma tabela bem
// menor e precisa olhar pra frente pra pegar vencimentos futuros ja cadastrados.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.join(__dirname, '..', 'src');
const connectorDir = path.join(__dirname, '..');

const jobs = [
  ['syncVendas.js', ['--dias=3']],
  ['syncRecebimentos.js', ['--dias=3']],
  ['syncItensVenda.js', ['--dias=3']],
  ['syncContasPagar.js', []],
];

console.log(`=== sync-all iniciado em ${new Date().toISOString()} ===`);

let algumFalhou = false;

for (const [script, args] of jobs) {
  const inicio = Date.now();
  console.log(`\n-- ${script} ${args.join(' ')} --`);
  try {
    execFileSync('node', [path.join(srcDir, script), ...args], { stdio: 'inherit', cwd: connectorDir });
    console.log(`${script} ok em ${((Date.now() - inicio) / 1000).toFixed(1)}s`);
  } catch (err) {
    algumFalhou = true;
    console.error(`${script} falhou:`, err.message);
    // segue pros proximos syncs mesmo se um falhar -- melhor ter dado parcial
    // atualizado do que nenhum.
  }
}

console.log(`\n=== sync-all finalizado em ${new Date().toISOString()} ===`);
if (algumFalhou) process.exit(1);
