'use client';

import { useEffect, useState } from 'react';
import { createClient } from '../../lib/supabase/client';
import { fetchAll } from '../../lib/supabase/fetchAll';
import { formatBRL } from '../../lib/format';
import SummaryCard from '../../components/SummaryCard';
import PageHeader from '../../components/PageHeader';

const CANAIS_COM_ENTREGA = ['iFood', 'Site', 'Telefone'];
// Mesma janela do backfill/DRE carregado. Vendas fora disso podem ter sido
// sincronizadas antes da coluna `origem` existir e cair tudo em "Salão" por
// engano -- por isso filtrar explicitamente, nao so confiar no que tem na tabela.
const PERIODO_INICIO = '2026-01-01';
const PERIODO_FIM = '2026-05-31';

function normalizeCanal(origem) {
  if (!origem) return 'Salão';
  if (origem === 'SITE') return 'Site';
  if (origem === 'iFood') return 'iFood';
  if (origem === 'TELEFONE') return 'Telefone';
  return origem;
}

function mesDe(dataIso) {
  return `${dataIso.slice(0, 7)}-01`;
}

function mesLabel(mesIso) {
  const [ano, mes] = mesIso.split('-');
  return `${mes}/${ano}`;
}

// Bandeira do cartao (Visa/Master/Elo/Amex) nao e rastreada pelo sistema --
// assume a faixa Visa/Master (a mais comum) pras duas adquirentes reais
// vistas em recebimentos.adquirente_tef. Pix e qualquer coisa nao mapeada
// fica sem taxa aplicada (0%).
function taxaCartaoPct(adquirenteTef, tipoCartaoTef, taxas) {
  if (!tipoCartaoTef) return 0;
  let adquirente = null;
  if (adquirenteTef === 'GETNET') adquirente = 'Getnet';
  else if (adquirenteTef === 'VERO') adquirente = 'Banricompras';
  else return 0;

  const modalidade =
    tipoCartaoTef === 'CREDITO'
      ? adquirente === 'Getnet'
        ? 'Crédito Visa/Master'
        : 'Crédito Master/Visa'
      : adquirente === 'Getnet'
        ? 'Débito Visa/Master'
        : 'Débito Master/Visa';

  const taxa = taxas.find((t) => t.adquirente === adquirente && t.modalidade === modalidade);
  return taxa ? Number(taxa.taxa_pct) : 0;
}

export default function MargemCanalPage() {
  const [linhas, setLinhas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function carregar() {
      const supabase = createClient();

      const [
        { data: vendas, error: e1 },
        { data: itens, error: e2 },
        { data: recebimentos, error: e3 },
        { data: dreTeleEntrega, error: e4 },
        { data: ifood, error: e5 },
        { data: taxas, error: e6 },
      ] = await Promise.all([
        fetchAll(() =>
          supabase
            .from('vendas')
            .select('os_codigo, data, origem, valor')
            .gte('data', PERIODO_INICIO)
            .lte('data', PERIODO_FIM)
            .order('os_codigo')
        ),
        fetchAll(() =>
          supabase
            .from('itens_venda')
            .select('os_codigo, qtd, custo_unit')
            .gte('data', PERIODO_INICIO)
            .lte('data', PERIODO_FIM)
            .order('id_item')
        ),
        fetchAll(() =>
          supabase
            .from('recebimentos')
            .select('pedido, valor_recebido, adquirente_tef, tipo_cartao_tef')
            .gte('data_recebimento', PERIODO_INICIO)
            .lte('data_recebimento', PERIODO_FIM)
            .order('prc_codigo')
        ),
        supabase.from('dre_mensal').select('mes_referencia, valor').eq('categoria', 'custos_variaveis').eq('item', 'Tele Entrega'),
        fetchAll(() =>
          supabase
            .from('ifood_mensal')
            .select('mes_referencia, categoria, valor')
            .in('categoria', ['taxas_comissoes', 'servicos'])
            .eq('item', 'Total')
        ),
        supabase.from('taxas_adquirente').select('adquirente, modalidade, taxa_pct'),
      ]);

      const err = e1 || e2 || e3 || e4 || e5 || e6;
      if (err) {
        setError(err.message);
        setLoading(false);
        return;
      }

      const vendaPorCodigo = {};
      for (const v of vendas) {
        vendaPorCodigo[v.os_codigo] = { mes: mesDe(v.data), canal: normalizeCanal(v.origem) };
      }

      const acc = {};
      function bucket(mes, canal) {
        const k = `${mes}|${canal}`;
        if (!acc[k]) acc[k] = { mes, canal, receita: 0, cmv: 0, custoCartao: 0, custoIfood: 0, custoMoto: 0 };
        return acc[k];
      }

      for (const v of vendas) {
        bucket(mesDe(v.data), normalizeCanal(v.origem)).receita += Number(v.valor) || 0;
      }

      for (const item of itens) {
        const info = vendaPorCodigo[item.os_codigo];
        if (!info) continue;
        bucket(info.mes, info.canal).cmv += (Number(item.qtd) || 0) * (Number(item.custo_unit) || 0);
      }

      for (const r of recebimentos) {
        const info = vendaPorCodigo[r.pedido];
        if (!info) continue;
        const taxaPct = taxaCartaoPct(r.adquirente_tef, r.tipo_cartao_tef, taxas);
        if (taxaPct > 0) {
          bucket(info.mes, info.canal).custoCartao += (Number(r.valor_recebido) || 0) * (taxaPct / 100);
        }
      }

      const ifoodPorMes = {};
      for (const r of ifood) {
        ifoodPorMes[r.mes_referencia] = (ifoodPorMes[r.mes_referencia] || 0) + Math.abs(Number(r.valor));
      }
      for (const [mes, custo] of Object.entries(ifoodPorMes)) {
        bucket(mes, 'iFood').custoIfood += custo;
      }

      // Rateio do custo de moto (TELE ENTREGA no DRE) entre iFood/Site/Telefone,
      // proporcional a receita -- Salao nao entra (nao tem entrega).
      const teleEntregaPorMes = {};
      for (const r of dreTeleEntrega) {
        teleEntregaPorMes[r.mes_referencia] = Number(r.valor);
      }
      for (const [mes, teleEntrega] of Object.entries(teleEntregaPorMes)) {
        const receitaEntrega = CANAIS_COM_ENTREGA.reduce((s, c) => s + (acc[`${mes}|${c}`]?.receita || 0), 0);
        if (receitaEntrega <= 0) continue;
        for (const c of CANAIS_COM_ENTREGA) {
          const b = acc[`${mes}|${c}`];
          if (b) b.custoMoto = teleEntrega * (b.receita / receitaEntrega);
        }
      }

      const lista = Object.values(acc)
        .map((b) => ({ ...b, margem: b.receita - b.cmv - b.custoCartao - b.custoIfood - b.custoMoto }))
        .filter((b) => b.receita > 0)
        .sort((a, b) => a.mes.localeCompare(b.mes) || a.canal.localeCompare(b.canal));

      setLinhas(lista);
      setLoading(false);
    }

    carregar();
  }, []);

  const porCanal = {};
  for (const l of linhas) {
    porCanal[l.canal] ??= { canal: l.canal, receita: 0, margem: 0 };
    porCanal[l.canal].receita += l.receita;
    porCanal[l.canal].margem += l.margem;
  }
  const resumoCanais = Object.values(porCanal).sort((a, b) => b.receita - a.receita);

  return (
    <div>
      <PageHeader
        eyebrow="Painel financeiro"
        title="Margem por canal"
        subtitle="Salão, Site, iFood, Telefone — jan a mai/2026 (mesmo período do DRE carregado)."
      />

      <p className="callout">
        <strong>Duas aproximações aqui:</strong> (1) taxa de cartão assume bandeira Visa/Master — o sistema não
        registra Visa/Master/Elo/Amex separadamente; (2) custo de moto-entrega é rateado proporcional à receita entre
        iFood/Site/Telefone (o DRE só tem o total do mês, não por canal). É margem de contribuição (receita − custo
        variável direto), sem ratear aluguel/folha/etc.
      </p>

      {error && <p className="error-text">{error}</p>}
      {loading && <p className="muted">Carregando (bastante dado, pode levar alguns segundos)...</p>}

      {!loading && !error && (
        <>
          <div className="cards-row">
            {resumoCanais.map((c) => (
              <SummaryCard
                key={c.canal}
                label={`${c.canal} — margem (5 meses)`}
                value={formatBRL(c.margem)}
                tone={c.margem >= 0 ? 'positivo' : 'negativo'}
              />
            ))}
          </div>

          <div className="surface" style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Mês</th>
                  <th>Canal</th>
                  <th className="text-right">Receita</th>
                  <th className="text-right">CMV</th>
                  <th className="text-right">Cartão</th>
                  <th className="text-right">iFood</th>
                  <th className="text-right">Moto</th>
                  <th className="text-right">Margem</th>
                  <th className="text-right">Margem %</th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((l) => (
                  <tr key={`${l.mes}|${l.canal}`}>
                    <td>{mesLabel(l.mes)}</td>
                    <td style={{ fontWeight: 600 }}>{l.canal}</td>
                    <td className="text-right">{formatBRL(l.receita)}</td>
                    <td className="text-right">{formatBRL(l.cmv)}</td>
                    <td className="text-right">{l.custoCartao ? formatBRL(l.custoCartao) : '-'}</td>
                    <td className="text-right">{l.custoIfood ? formatBRL(l.custoIfood) : '-'}</td>
                    <td className="text-right">{l.custoMoto ? formatBRL(l.custoMoto) : '-'}</td>
                    <td className={`text-right${l.margem < 0 ? ' num-negativo' : ''}`}>{formatBRL(l.margem)}</td>
                    <td className="text-right">{l.receita ? ((l.margem / l.receita) * 100).toFixed(1) : '0.0'}%</td>
                  </tr>
                ))}
                {linhas.length === 0 && (
                  <tr>
                    <td colSpan={9} style={{ padding: '0.5rem 0' }}>
                      Sem dados no período.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
