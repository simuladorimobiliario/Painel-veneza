'use client';

import { useEffect, useState } from 'react';
import { createClient } from '../../lib/supabase/client';
import { fetchAll } from '../../lib/supabase/fetchAll';
import PageHeader from '../../components/PageHeader';

const DIAS_JANELA = 30;
const QTD_MINIMA = 5; // ignora itens vendidos poucas vezes, ruido estatistico
const TOP_N = 15;

function toIso(d) {
  return d.toISOString().slice(0, 10);
}

function TabelaMargem({ titulo, itens }) {
  return (
    <div className="surface" style={{ flex: 1, minWidth: 320 }}>
      <div className="section-title">{titulo}</div>
      <table className="table" style={{ marginTop: '0.75rem' }}>
        <thead>
          <tr>
            <th>Produto</th>
            <th className="text-right">Qtd</th>
            <th className="text-right">Margem</th>
          </tr>
        </thead>
        <tbody>
          {itens.map((i) => (
            <tr key={i.prd_codigo}>
              <td>{i.produto}</td>
              <td className="text-right">{i.qtd}</td>
              <td className={`text-right${i.margemPct < 0 ? ' num-negativo' : ''}`}>{i.margemPct.toFixed(1)}%</td>
            </tr>
          ))}
          {itens.length === 0 && (
            <tr>
              <td colSpan={3} style={{ padding: '0.4rem 0' }}>
                Sem dados suficientes.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function CurvaAbcPage() {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function carregar() {
      const supabase = createClient();
      const iniIso = toIso(new Date(Date.now() - DIAS_JANELA * 24 * 60 * 60 * 1000));

      const { data, error: selectError } = await fetchAll(() =>
        supabase
          .from('itens_venda')
          .select('prd_codigo, produto, qtd, vunit, custo_unit')
          .gte('data', iniIso)
          .order('id_item', { ascending: true })
      );

      if (selectError) {
        setError(selectError.message);
        setLoading(false);
        return;
      }

      const porProduto = {};
      for (const item of data) {
        const chave = item.prd_codigo;
        if (!porProduto[chave]) {
          porProduto[chave] = { prd_codigo: chave, produto: item.produto, qtd: 0, receita: 0, custo: 0 };
        }
        const qtd = Number(item.qtd) || 0;
        const vunit = Number(item.vunit) || 0;
        const custoUnit = Number(item.custo_unit) || 0;
        porProduto[chave].qtd += qtd;
        porProduto[chave].receita += qtd * vunit;
        porProduto[chave].custo += qtd * custoUnit;
      }

      const lista = Object.values(porProduto)
        .filter((p) => p.qtd >= QTD_MINIMA && p.receita > 0)
        .map((p) => ({ ...p, margemPct: ((p.receita - p.custo) / p.receita) * 100 }));

      setProdutos(lista);
      setLoading(false);
    }

    carregar();
  }, []);

  const melhores = [...produtos].sort((a, b) => b.margemPct - a.margemPct).slice(0, TOP_N);
  const piores = [...produtos].sort((a, b) => a.margemPct - b.margemPct).slice(0, TOP_N);

  return (
    <div>
      <PageHeader
        eyebrow="Painel financeiro"
        title="Curva ABC de margem"
        subtitle={`Últimos ${DIAS_JANELA} dias, produtos com pelo menos ${QTD_MINIMA} unidades vendidas.`}
      />

      <p className="callout">
        <strong>Atenção antes de confiar 100% nesses números:</strong> alguns itens podem mostrar margem negativa
        impossível (custo cadastrado por caixa/pacote em vez de por unidade vendida) ou aparecer aqui mesmo sendo
        consumo interno (ex: prato de funcionário, não venda de verdade). Vale conferir os extremos antes de agir em
        cima deles.
      </p>

      {error && <p className="error-text">{error}</p>}
      {loading && <p className="muted">Carregando...</p>}

      {!loading && !error && (
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          <TabelaMargem titulo="Melhores margens" itens={melhores} />
          <TabelaMargem titulo="Piores margens" itens={piores} />
        </div>
      )}
    </div>
  );
}
