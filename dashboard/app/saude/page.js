'use client';

import { useEffect, useState } from 'react';
import { createClient } from '../../lib/supabase/client';
import { fetchAll } from '../../lib/supabase/fetchAll';
import { formatBRL, formatDataBR } from '../../lib/format';
import SummaryCard from '../../components/SummaryCard';
import PageHeader from '../../components/PageHeader';

const NOMES_LOJA = { pratos: 'Veneza Pratos', lanches: 'Veneza Lanches' };

function somaCategoria(linhas, categoria) {
  return linhas.filter((l) => l.categoria === categoria).reduce((s, l) => s + Number(l.valor), 0);
}

function valorItem(linhas, categoria, item) {
  const linha = linhas.find((l) => l.categoria === categoria && l.item === item);
  return linha ? Number(linha.valor) : 0;
}

export default function SaudePage() {
  const [dreMeses, setDreMeses] = useState([]);
  const [ifoodMeses, setIfoodMeses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function carregar() {
      const supabase = createClient();

      const [{ data: dre, error: errDre }, { data: ifood, error: errIfood }] = await Promise.all([
        fetchAll(() => supabase.from('dre_mensal').select('mes_referencia, categoria, item, valor').order('mes_referencia')),
        fetchAll(() =>
          supabase
            .from('ifood_mensal')
            .select('mes_referencia, loja, categoria, item, valor')
            .in('categoria', ['vendas', 'taxas_comissoes', 'servicos'])
            .eq('item', 'Total')
            .order('mes_referencia')
        ),
      ]);

      if (errDre || errIfood) {
        setError((errDre || errIfood).message);
        setLoading(false);
        return;
      }

      // ---- DRE: agrupa por mes e calcula os indicadores ----
      const porMesDre = {};
      for (const linha of dre) {
        (porMesDre[linha.mes_referencia] ??= []).push(linha);
      }
      const dreCalculado = Object.entries(porMesDre)
        .map(([mes, linhas]) => {
          const receita = valorItem(linhas, 'receita', 'Receita de Vendas');
          const cmv = somaCategoria(linhas, 'materia_prima');
          const custoVariavelExtra = somaCategoria(linhas, 'custos_variaveis');
          const pessoal = somaCategoria(linhas, 'pessoal');
          const custoFixo =
            pessoal +
            somaCategoria(linhas, 'despesas_operacionais') +
            somaCategoria(linhas, 'marketing') +
            somaCategoria(linhas, 'servicos_terceiros');
          const ebitda = valorItem(linhas, 'resultado', 'EBITDA');
          const resultadoLiquido = valorItem(linhas, 'resultado', 'Resultado Líquido');
          return {
            mes,
            receita,
            cmvPct: receita ? (cmv / receita) * 100 : 0,
            fixoPct: receita ? (custoFixo / receita) * 100 : 0,
            primeCostPct: receita ? ((cmv + pessoal) / receita) * 100 : 0,
            custoVariavelTotalPct: receita ? ((cmv + custoVariavelExtra) / receita) * 100 : 0,
            ebitda,
            ebitdaPct: receita ? (ebitda / receita) * 100 : 0,
            resultadoLiquido,
          };
        })
        .sort((a, b) => a.mes.localeCompare(b.mes));

      // ---- iFood: agrupa por mes+loja, margem liquida real ----
      const porMesLoja = {};
      for (const linha of ifood) {
        const chave = `${linha.mes_referencia}|${linha.loja}`;
        (porMesLoja[chave] ??= { mes: linha.mes_referencia, loja: linha.loja, vendas: 0, taxas: 0, servicos: 0 });
        if (linha.categoria === 'vendas') porMesLoja[chave].vendas += Number(linha.valor);
        if (linha.categoria === 'taxas_comissoes') porMesLoja[chave].taxas += Math.abs(Number(linha.valor));
        if (linha.categoria === 'servicos') porMesLoja[chave].servicos += Math.abs(Number(linha.valor));
      }
      const ifoodCalculado = Object.values(porMesLoja)
        .map((r) => ({
          ...r,
          custoTotal: r.taxas + r.servicos,
          margemLiquidaPct: r.vendas ? ((r.vendas - r.taxas - r.servicos) / r.vendas) * 100 : 0,
        }))
        .sort((a, b) => a.mes.localeCompare(b.mes) || a.loja.localeCompare(b.loja));

      setDreMeses(dreCalculado);
      setIfoodMeses(ifoodCalculado);
      setLoading(false);
    }

    carregar();
  }, []);

  const ultimoMes = dreMeses[dreMeses.length - 1];

  return (
    <div>
      <PageHeader
        eyebrow="Painel financeiro"
        title="Saúde do negócio"
        subtitle="Fixo, CMV, prime cost e margem por canal — visão pra decisão estratégica, não só operacional."
      />

      {error && <p className="error-text">{error}</p>}
      {loading && <p className="muted">Carregando...</p>}

      {!loading && !error && (
        <>
          {ultimoMes && (
            <div className="cards-row">
              <SummaryCard label={`CMV% (${formatDataBR(ultimoMes.mes).slice(3)})`} value={`${ultimoMes.cmvPct.toFixed(1)}%`} />
              <SummaryCard label="% Custo fixo / faturamento" value={`${ultimoMes.fixoPct.toFixed(1)}%`} />
              <SummaryCard label="Prime cost (CMV + pessoal)" value={`${ultimoMes.primeCostPct.toFixed(1)}%`} />
              <SummaryCard
                label="EBITDA (operacional)"
                value={formatBRL(ultimoMes.ebitda)}
                tone={ultimoMes.ebitda >= 0 ? 'positivo' : 'negativo'}
              />
              <SummaryCard
                label="Resultado líquido (com dívida)"
                value={formatBRL(ultimoMes.resultadoLiquido)}
                tone={ultimoMes.resultadoLiquido >= 0 ? 'positivo' : 'negativo'}
              />
            </div>
          )}

          <div className="surface">
            <div className="section-title">DRE mensal</div>
            <p className="section-note">
              EBITDA é o resultado da operação (venda menos custo menos despesa fixa). Resultado líquido inclui
              também dívida/investimentos — a diferença entre os dois mostra quanto do prejuízo é operação vs.
              dívida.
            </p>
            <p className="callout">
              <strong>Atenção ao ler mês a mês:</strong> receita entra por competência (data da venda), mas despesa
              entra por caixa (data do pagamento). Uma conta paga com atraso desloca o custo pro mês seguinte — ex:
              maio/2026 mostra imposto quase zero porque o imposto real foi pago em junho. Não leia um mês isolado
              como &quot;a nova realidade&quot; sem checar se não é só timing de pagamento.
            </p>
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Mês</th>
                    <th className="text-right">Receita</th>
                    <th className="text-right">CMV%</th>
                    <th className="text-right">% Fixo</th>
                    <th className="text-right">Prime cost</th>
                    <th className="text-right">EBITDA</th>
                    <th className="text-right">Resultado líquido</th>
                  </tr>
                </thead>
                <tbody>
                  {dreMeses.map((m) => (
                    <tr key={m.mes}>
                      <td>{formatDataBR(m.mes).slice(3)}</td>
                      <td className="text-right">{formatBRL(m.receita)}</td>
                      <td className="text-right">{m.cmvPct.toFixed(1)}%</td>
                      <td className="text-right">{m.fixoPct.toFixed(1)}%</td>
                      <td className="text-right">{m.primeCostPct.toFixed(1)}%</td>
                      <td className={`text-right${m.ebitda < 0 ? ' num-negativo' : ''}`}>{formatBRL(m.ebitda)}</td>
                      <td className={`text-right${m.resultadoLiquido < 0 ? ' num-negativo' : ''}`}>
                        {formatBRL(m.resultadoLiquido)}
                      </td>
                    </tr>
                  ))}
                  {dreMeses.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ padding: '0.5rem 0' }}>
                        Nenhum DRE cadastrado ainda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="surface">
            <div className="section-title">Margem líquida por loja iFood</div>
            <p className="section-note">
              % do valor do pedido que sobra depois das taxas/comissões do iFood e do pacote de anúncios (não conta
              promoção, que já reduz o valor do pedido em si).
            </p>
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Mês</th>
                    <th>Loja</th>
                    <th className="text-right">Vendas</th>
                    <th className="text-right">Custo iFood</th>
                    <th className="text-right">Margem líquida</th>
                  </tr>
                </thead>
                <tbody>
                  {ifoodMeses.map((r) => (
                    <tr key={`${r.mes}|${r.loja}`}>
                      <td>{formatDataBR(r.mes).slice(3)}</td>
                      <td>{NOMES_LOJA[r.loja] || r.loja}</td>
                      <td className="text-right">{formatBRL(r.vendas)}</td>
                      <td className="text-right">{formatBRL(r.custoTotal)}</td>
                      <td className="text-right">{r.margemLiquidaPct.toFixed(1)}%</td>
                    </tr>
                  ))}
                  {ifoodMeses.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ padding: '0.5rem 0' }}>
                        Nenhum dado do iFood cadastrado ainda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <p className="callout" style={{ marginBottom: 0 }}>
            <strong>Falta a margem do salão descontando taxa de cartão de verdade.</strong> O sistema só registra
            &quot;Getnet crédito/débito&quot; sem dizer a bandeira (Visa/Master/Elo/Amex têm taxas diferentes), e
            aparece uma adquirente &quot;VERO&quot; que não está nas taxas que você passou. Precisa fechar esses dois
            pontos antes de calcular isso com confiança.
          </p>
        </>
      )}
    </div>
  );
}
