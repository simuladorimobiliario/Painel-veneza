'use client';

import { useEffect, useState } from 'react';
import { createClient } from '../../lib/supabase/client';
import { fetchAll } from '../../lib/supabase/fetchAll';
import { formatBRL, formatDataBR } from '../../lib/format';
import SummaryCard from '../../components/SummaryCard';
import PageHeader from '../../components/PageHeader';

function toIso(d) {
  return d.toISOString().slice(0, 10);
}

export default function ContasAPagarPage() {
  const [contas, setContas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function carregar() {
      const supabase = createClient();
      const { data, error: selectError } = await fetchAll(() =>
        supabase
          .from('contas_pagar')
          .select('ctp_codigo, data_vencimento, data_pagamento, valor, saldo, status, fornecedor')
          .order('data_vencimento', { ascending: true })
          .order('ctp_codigo', { ascending: true })
      );

      if (selectError) {
        setError(selectError.message);
        setLoading(false);
        return;
      }
      setContas(data);
      setLoading(false);
    }

    carregar();
  }, []);

  const hojeIso = toIso(new Date());
  const trintaDiasAtrasIso = toIso(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));

  const emAberto = contas.filter((c) => !c.data_pagamento);
  const vencidas = emAberto.filter((c) => c.data_vencimento < hojeIso);
  const pagasRecentes = contas.filter((c) => c.data_pagamento && c.data_pagamento >= trintaDiasAtrasIso);

  const totalEmAberto = emAberto.reduce((s, c) => s + (Number(c.saldo) || 0), 0);
  const totalVencido = vencidas.reduce((s, c) => s + (Number(c.saldo) || 0), 0);
  // valor_pago vem zerado com frequencia mesmo em contas pagas de verdade
  // (emprestimos, INSS, pro-labore...); valor - saldo reflete a realidade.
  const totalPagoRecente = pagasRecentes.reduce((s, c) => s + ((Number(c.valor) || 0) - (Number(c.saldo) || 0)), 0);

  return (
    <div>
      <PageHeader eyebrow="Painel financeiro" title="Contas a pagar" />

      {error && <p className="error-text">{error}</p>}
      {loading && <p className="muted">Carregando...</p>}

      {!loading && !error && (
        <>
          <div className="cards-row">
            <SummaryCard label="Em aberto" value={formatBRL(totalEmAberto)} />
            <SummaryCard label="Vencido" value={formatBRL(totalVencido)} tone={totalVencido > 0 ? 'negativo' : undefined} />
            <SummaryCard label="Pago (30d)" value={formatBRL(totalPagoRecente)} />
          </div>

          <div className="surface" style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Fornecedor</th>
                  <th className="text-right">Valor</th>
                  <th>Vencimento</th>
                  <th>Pagamento</th>
                  <th>Situação</th>
                </tr>
              </thead>
              <tbody>
                {contas.map((c) => {
                  const vencida = !c.data_pagamento && c.data_vencimento < hojeIso;
                  return (
                    <tr key={c.ctp_codigo}>
                      <td>{c.fornecedor || '-'}</td>
                      <td className="text-right">{formatBRL(c.valor)}</td>
                      <td>{formatDataBR(c.data_vencimento)}</td>
                      <td>{formatDataBR(c.data_pagamento)}</td>
                      <td>
                        {c.data_pagamento ? (
                          <span className="badge badge-positivo">Pago</span>
                        ) : vencida ? (
                          <span className="badge badge-negativo">⚠ Vencido</span>
                        ) : (
                          <span className="badge badge-neutro">Em aberto</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {contas.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: '0.5rem 0' }}>
                      Nenhuma conta encontrada.
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
