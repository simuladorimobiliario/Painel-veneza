'use client';

import { useEffect, useState } from 'react';
import { createClient } from '../../lib/supabase/client';
import { formatBRL, formatDataBR } from '../../lib/format';
import SummaryCard from '../../components/SummaryCard';
import PageHeader from '../../components/PageHeader';

// Construtor local (ano, mes 0-indexado, dia) de proposito -- new Date('2027-06-01')
// parseia como UTC meia-noite, que em fuso negativo (Brasil) vira o dia
// anterior na comparacao com `new Date()` (local), desalinhando a conta de meses.
const INICIO_META_RESERVA = new Date(2026, 6, 1);
const META_RESERVA_MIN = 2100;
const META_RESERVA_MAX = 2300;
const FIM_CARENCIA_SICREDI = new Date(2027, 5, 1);

function mesesEntre(inicio, fim) {
  return Math.max(0, (fim.getFullYear() - inicio.getFullYear()) * 12 + (fim.getMonth() - inicio.getMonth()));
}

export default function DividaReservaPage() {
  const [dividas, setDividas] = useState([]);
  const [reserva, setReserva] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function carregar() {
      const supabase = createClient();
      const [{ data, error: selectError }, { data: reservaData, error: reservaError }] = await Promise.all([
        supabase
          .from('dividas')
          .select('*')
          .eq('ativa', true)
          .order('data_primeira_parcela', { ascending: true, nullsFirst: true }),
        supabase
          .from('reserva_saldo')
          .select('*')
          .order('data_referencia', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      const err = selectError || reservaError;
      if (err) {
        setError(err.message);
        setLoading(false);
        return;
      }
      setDividas(data);
      setReserva(reservaData);
      setLoading(false);
    }

    carregar();
  }, []);

  const hoje = new Date();

  // Dividas ja rodando (sem data_primeira_parcela futura) entram no "antes".
  const jaRodando = dividas.filter((d) => !d.data_primeira_parcela || new Date(d.data_primeira_parcela) <= hoje);
  const futuras = dividas.filter((d) => d.data_primeira_parcela && new Date(d.data_primeira_parcela) > hoje);

  const servicoAtualMin = jaRodando.reduce((s, d) => s + (Number(d.valor_parcela_min) || 0), 0);
  const servicoAtualMax = jaRodando.reduce((s, d) => s + (Number(d.valor_parcela_max) || 0), 0);
  const servicoPosMin = servicoAtualMin + futuras.reduce((s, d) => s + (Number(d.valor_parcela_min) || 0), 0);
  const servicoPosMax = servicoAtualMax + futuras.reduce((s, d) => s + (Number(d.valor_parcela_max) || 0), 0);

  const mesesDeMetaAteAgora = mesesEntre(INICIO_META_RESERVA, hoje) + 1; // mes de inicio conta
  const metaAcumuladaMin = mesesDeMetaAteAgora * META_RESERVA_MIN;
  const metaAcumuladaMax = mesesDeMetaAteAgora * META_RESERVA_MAX;

  const mesesAteCarencia = mesesEntre(hoje, FIM_CARENCIA_SICREDI);

  const saldoReal = reserva ? Number(reserva.valor) : null;
  const deficitMin = saldoReal != null ? metaAcumuladaMin - saldoReal : null;
  const deficitMax = saldoReal != null ? metaAcumuladaMax - saldoReal : null;

  return (
    <div>
      <PageHeader
        eyebrow="Painel financeiro"
        title="Dívida & Reserva"
        subtitle="Dado alimentado manualmente (não vem de nenhum sistema sincronizado) — atualize a tabela `dividas` no Supabase conforme as parcelas avançam."
      />

      {error && <p className="error-text">{error}</p>}
      {loading && <p className="muted">Carregando...</p>}

      {!loading && !error && (
        <>
          <div className="cards-row">
            <SummaryCard label="Serviço de dívida hoje" value={`${formatBRL(servicoAtualMin)} – ${formatBRL(servicoAtualMax)}/mês`} />
            <SummaryCard
              label="Serviço de dívida pós-jun/2027"
              value={`${formatBRL(servicoPosMin)} – ${formatBRL(servicoPosMax)}/mês`}
              tone="negativo"
            />
            <SummaryCard label="Meses até o salto" value={`${mesesAteCarencia} meses`} />
            <SummaryCard
              label="Reserva: meta acumulada até hoje"
              value={`${formatBRL(metaAcumuladaMin)} – ${formatBRL(metaAcumuladaMax)}`}
            />
            <SummaryCard
              label="Reserva: saldo real"
              value={saldoReal != null ? formatBRL(saldoReal) : 'sem registro'}
              tone={saldoReal === 0 ? 'negativo' : undefined}
            />
            {deficitMin != null && (
              <SummaryCard
                label="Déficit vs. meta"
                value={`${formatBRL(deficitMin)} – ${formatBRL(deficitMax)}`}
                tone={deficitMin > 0 ? 'negativo' : 'positivo'}
              />
            )}
          </div>

          <p className="muted" style={{ marginBottom: '1.5rem' }}>
            A meta de reserva é R$2.100–2.300/mês desde jul/2026, pra amortecer o salto no serviço de dívida quando a
            carência do Sicredi terminar. &quot;Meta acumulada até hoje&quot; é quanto deveria ter sido guardado seguindo a
            meta. &quot;Saldo real&quot; vem da tabela `reserva_saldo` — um registro manual que você atualiza de tempos em
            tempos (não é sincronizado automaticamente).
            {reserva && (
              <>
                {' '}
                Último registro: <strong>{formatDataBR(reserva.data_referencia)}</strong>
                {reserva.observacao ? ` — ${reserva.observacao}` : ''}
              </>
            )}
          </p>

          <div className="surface">
            <div className="section-title">Dívidas ativas</div>
            <div style={{ overflowX: 'auto', marginTop: '0.75rem' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Dívida</th>
                    <th>Parcela</th>
                    <th className="text-right">Valor/mês</th>
                    <th>1ª parcela</th>
                    <th>Observação</th>
                  </tr>
                </thead>
                <tbody>
                  {dividas.map((d) => (
                    <tr key={d.id}>
                      <td style={{ fontWeight: 600 }}>{d.nome}</td>
                      <td>{d.parcela_atual != null && d.parcelas_totais ? `${d.parcela_atual} de ${d.parcelas_totais}` : '-'}</td>
                      <td className="text-right">
                        {d.valor_parcela_min === d.valor_parcela_max
                          ? formatBRL(d.valor_parcela_min)
                          : `${formatBRL(d.valor_parcela_min)} – ${formatBRL(d.valor_parcela_max)}`}
                      </td>
                      <td>{d.data_primeira_parcela ? formatDataBR(d.data_primeira_parcela) : 'em curso'}</td>
                      <td className="muted" style={{ maxWidth: 420 }}>
                        {d.observacao}
                        {d.coobrigados && (
                          <>
                            <br />
                            <strong>Coobrigados:</strong> {d.coobrigados}
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                  {dividas.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ padding: '0.5rem 0' }}>
                        Nenhuma dívida cadastrada ainda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
