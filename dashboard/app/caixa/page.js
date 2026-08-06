'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '../../lib/supabase/client';
import { fetchAll } from '../../lib/supabase/fetchAll';
import { formatBRL, formatDataBR } from '../../lib/format';
import SummaryCard from '../../components/SummaryCard';
import CaixaChart from '../../components/CaixaChart';
import PageHeader from '../../components/PageHeader';
import SaldoCaixaForm from '../../components/SaldoCaixaForm';
import AntecipacaoForm from '../../components/AntecipacaoForm';

const DIAS_HISTORICO = 30;
const DIAS_PROJECAO = 7;
const SEMANAS_MEDIA = 8; // janela pra media de faturamento por dia da semana

// Mesmas constantes de /divida-reserva -- meta de reserva mensal desde jul/2026.
// Construtor local de proposito (ver nota em divida-reserva/page.js sobre fuso).
const INICIO_META_RESERVA = new Date(2026, 6, 1);
const META_RESERVA_MIN = 2100;
const META_RESERVA_MAX = 2300;

const DIAS_SEMANA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const CATEGORIAS_PAGAMENTO = ['Dinheiro', 'Pix', 'Débito', 'Crédito', 'iFood', 'Outros'];

function toIso(d) {
  return d.toISOString().slice(0, 10);
}

// Agrupa o vocabulario bagunçado de forma_pagamento (varia por canal/epoca:
// "1 - DINHEIRO", "3 - CARTAO TEF", "CARTÃO DÉBITO", "9-IFOOD ON LINE"...)
// em 6 categorias com prazo de liquidacao conhecido.
function normalizarCategoriaPagamento(r) {
  const fp = (r.forma_pagamento || '').toUpperCase();
  if (fp.includes('IFOOD')) return 'iFood';
  if (fp.includes('DINHEIRO')) return 'Dinheiro';
  if (fp.includes('PIX')) return 'Pix';
  if (fp.includes('CARTAO TEF') || fp.includes('CARTÃO TEF')) {
    if (r.tipo_cartao_tef === 'DEBITO') return 'Débito';
    if (r.tipo_cartao_tef === 'CREDITO') return 'Crédito';
    return 'Outros';
  }
  if (fp.includes('DEBITO') || fp.includes('DÉBITO')) return 'Débito';
  if (fp.includes('CREDITO') || fp.includes('CRÉDITO')) return 'Crédito';
  return 'Outros'; // cheque, voucher, antecipacao de cliente, banco, etc.
}

// Confirmado com o Fernando 2026-08-05: debito liquida D+1, credito D+30,
// dinheiro/pix mesmo dia. Confirmado 2026-08-06: iFood repassa semanalmente,
// toda quarta-feira, cerca de 1 semana apos a venda -- aproximado aqui como a
// primeira quarta-feira a partir de 7 dias depois da venda (nao sabemos o
// corte exato da semana do iFood, so o dia do repasse).
function proximaQuartaApos(dataVenda, minDias) {
  const d = new Date(`${dataVenda}T00:00:00`);
  d.setDate(d.getDate() + minDias);
  while (d.getDay() !== 3) d.setDate(d.getDate() + 1);
  return toIso(d);
}

function dataLiquidacaoCategoria(dataVenda, categoria) {
  if (categoria === 'iFood') return proximaQuartaApos(dataVenda, 7);
  const dias = categoria === 'Crédito' ? 30 : categoria === 'Débito' ? 1 : 0;
  const d = new Date(`${dataVenda}T00:00:00`);
  d.setDate(d.getDate() + dias);
  return toIso(d);
}

function mesesEntre(inicio, fim) {
  return Math.max(0, (fim.getFullYear() - inicio.getFullYear()) * 12 + (fim.getMonth() - inicio.getMonth()));
}

function somaCategoria(linhas, categoria) {
  return linhas.filter((l) => l.categoria === categoria).reduce((s, l) => s + Number(l.valor), 0);
}

function valorItem(linhas, categoria, item) {
  const linha = linhas.find((l) => l.categoria === categoria && l.item === item);
  return linha ? Number(linha.valor) : 0;
}

export default function CaixaPage() {
  const [dias, setDias] = useState([]);
  const [aVencer, setAVencer] = useState([]);
  const [ultimoMesDre, setUltimoMesDre] = useState(null);
  const [reserva, setReserva] = useState(null);
  const [saldoCaixaLinhas, setSaldoCaixaLinhas] = useState([]);
  const [antecipacoes, setAntecipacoes] = useState([]);
  const [mediaSemanal, setMediaSemanal] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const hoje = new Date();
    const hojeIso = toIso(hoje);
    const inicioHistorico = new Date(hoje.getTime() - DIAS_HISTORICO * 24 * 60 * 60 * 1000);
    const fimProjecaoIso = toIso(new Date(hoje.getTime() + DIAS_PROJECAO * 24 * 60 * 60 * 1000));
    // Recebimentos desde 60 dias antes do historico: uma venda no credito de
    // ha ate 30 dias liquida so nos proximos dias, precisa entrar na conta.
    const iniBuscaRecebimentos = toIso(new Date(inicioHistorico.getTime() - 30 * 24 * 60 * 60 * 1000));

    const [
      { data: recebimentos, error: errRec },
      { data: pagamentosRealizados, error: errPagRealizados },
      { data: contasAVencer, error: errAVencer },
      { data: dre, error: errDre },
      { data: reservaData, error: errReserva },
      { data: saldoCaixaRows, error: errSaldoCaixa },
      { data: antecipacoesRows, error: errAntecipacoes },
    ] = await Promise.all([
      fetchAll(() =>
        supabase
          .from('recebimentos')
          .select('data_recebimento, valor_recebido, tipo_cartao_tef, forma_pagamento')
          .gte('data_recebimento', iniBuscaRecebimentos)
          .lte('data_recebimento', hojeIso)
          .order('prc_codigo', { ascending: true })
      ),
      fetchAll(() =>
        supabase
          .from('contas_pagar')
          .select('data_pagamento, valor, saldo')
          .not('data_pagamento', 'is', null)
          .gte('data_pagamento', toIso(inicioHistorico))
          .lte('data_pagamento', hojeIso)
          .order('ctp_codigo', { ascending: true })
      ),
      fetchAll(() =>
        supabase
          .from('contas_pagar')
          .select('ctp_codigo, data_vencimento, valor, saldo, fornecedor')
          .is('data_pagamento', null)
          .gte('data_vencimento', hojeIso)
          .lte('data_vencimento', fimProjecaoIso)
          .order('data_vencimento', { ascending: true })
      ),
      fetchAll(() => supabase.from('dre_mensal').select('mes_referencia, categoria, item, valor').order('mes_referencia')),
      supabase.from('reserva_saldo').select('*').order('data_referencia', { ascending: false }).limit(1).maybeSingle(),
      fetchAll(() =>
        supabase
          .from('saldo_caixa')
          .select('*')
          .order('data_referencia', { ascending: false })
          .order('criado_em', { ascending: false })
      ),
      fetchAll(() => supabase.from('antecipacoes').select('*').order('data_referencia', { ascending: false })),
    ]);

    const err = errRec || errPagRealizados || errAVencer || errDre || errReserva || errSaldoCaixa || errAntecipacoes;
    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    // ---- historico (30d) + projecao (7d) de caixa, dia a dia ----
    const porDia = {};
    const totalDias = DIAS_HISTORICO + DIAS_PROJECAO;
    for (let i = 0; i <= totalDias; i += 1) {
      const d = toIso(new Date(inicioHistorico.getTime() + i * 24 * 60 * 60 * 1000));
      porDia[d] = { data: d, entradas: 0, saidas: 0 };
    }

    for (const r of recebimentos) {
      const categoria = normalizarCategoriaPagamento(r);
      const dataDisponivel = dataLiquidacaoCategoria(r.data_recebimento, categoria);
      if (porDia[dataDisponivel]) porDia[dataDisponivel].entradas += Number(r.valor_recebido) || 0;
    }

    // ---- media de faturamento por dia da semana (ultimas SEMANAS_MEDIA
    // semanas completas, excluindo hoje que ainda esta em andamento) --
    // usada pra projetar vendas que AINDA VAO ACONTECER nos proximos dias,
    // nao so o que ja foi vendido e esta esperando liquidar.
    const fimJanelaMedia = toIso(new Date(hoje.getTime() - 1 * 24 * 60 * 60 * 1000)); // ontem
    const inicioJanelaMedia = toIso(new Date(hoje.getTime() - SEMANAS_MEDIA * 7 * 24 * 60 * 60 * 1000));
    const somaPorDiaSemana = {}; // `${weekday}|${categoria}` -> soma

    for (const r of recebimentos) {
      if (r.data_recebimento < inicioJanelaMedia || r.data_recebimento > fimJanelaMedia) continue;
      const categoria = normalizarCategoriaPagamento(r);
      const weekday = new Date(`${r.data_recebimento}T00:00:00`).getDay();
      const k = `${weekday}|${categoria}`;
      somaPorDiaSemana[k] = (somaPorDiaSemana[k] || 0) + (Number(r.valor_recebido) || 0);
    }

    const mediaPorDiaSemana = (weekday, categoria) => (somaPorDiaSemana[`${weekday}|${categoria}`] || 0) / SEMANAS_MEDIA;

    // Grade pra exibir e conferir a media usada (7 dias x 6 categorias).
    const mediaSemanalCalc = DIAS_SEMANA.map((label, weekday) => {
      const linha = { weekday, label };
      let total = 0;
      for (const categoria of CATEGORIAS_PAGAMENTO) {
        const v = mediaPorDiaSemana(weekday, categoria);
        linha[categoria] = v;
        total += v;
      }
      linha.total = total;
      return linha;
    });

    // Projeta vendas futuras (dias apos hoje) usando a media do dia da
    // semana, aplicando o mesmo prazo de liquidacao de cada categoria.
    for (const d of Object.values(porDia)) {
      if (d.data <= hojeIso) continue;
      const weekday = new Date(`${d.data}T00:00:00`).getDay();
      for (const categoria of CATEGORIAS_PAGAMENTO) {
        const media = mediaPorDiaSemana(weekday, categoria);
        if (!media) continue;
        const dataChegada = dataLiquidacaoCategoria(d.data, categoria);
        if (porDia[dataChegada]) {
          porDia[dataChegada].entradas += media;
          porDia[dataChegada].estimado = (porDia[dataChegada].estimado || 0) + media;
        }
      }
    }

    for (const p of pagamentosRealizados) {
      // valor_pago vem zerado com frequencia mesmo em contas realmente pagas
      // (emprestimos, INSS, pro-labore...) -- valor - saldo bate com a realidade.
      if (porDia[p.data_pagamento]) {
        porDia[p.data_pagamento].saidas += (Number(p.valor) || 0) - (Number(p.saldo) || 0);
      }
    }
    // Projecao: contas ja com vencimento definido mas ainda nao pagas contam
    // como saida esperada no dia do vencimento (nao e garantido que saia
    // exatamente nesse dia, mas e a melhor estimativa disponivel).
    for (const c of contasAVencer) {
      if (porDia[c.data_vencimento]) {
        porDia[c.data_vencimento].saidas += Number(c.saldo) || Number(c.valor) || 0;
      }
    }

    const diasArr = Object.values(porDia).sort((a, b) => a.data.localeCompare(b.data));

    // ---- ultimo mes fechado do DRE (resumo, detalhe fica em /saude) ----
    const porMes = {};
    for (const linha of dre) {
      (porMes[linha.mes_referencia] ??= []).push(linha);
    }
    const mesesOrdenados = Object.keys(porMes).sort();
    const ultimoMes = mesesOrdenados[mesesOrdenados.length - 1];
    if (ultimoMes) {
      const linhas = porMes[ultimoMes];
      const receita = valorItem(linhas, 'receita', 'Receita de Vendas');
      const cmv = somaCategoria(linhas, 'materia_prima');
      setUltimoMesDre({
        mes: ultimoMes,
        cmvPct: receita ? (cmv / receita) * 100 : 0,
        resultadoLiquido: valorItem(linhas, 'resultado', 'Resultado Líquido'),
      });
    }

    // ---- saldo real por conta: o ULTIMO registro de CADA conta, nao a data
    // mais recente entre todas -- assim atualizar so o Banrisul (por ex.) nao
    // faz o Santander/Sicredi/Caixa desaparecerem do total. saldoCaixaRows ja
    // vem ordenado data desc, criado_em desc, entao a primeira ocorrencia de
    // cada conta e a mais recente dela.
    const porConta = {};
    for (const r of saldoCaixaRows) {
      if (!porConta[r.conta]) porConta[r.conta] = r;
    }
    const saldoCaixaAtual = Object.values(porConta).sort((a, b) => (a.conta || '').localeCompare(b.conta || ''));

    setDias(diasArr);
    setAVencer(contasAVencer);
    setReserva(reservaData);
    setSaldoCaixaLinhas(saldoCaixaAtual);
    setAntecipacoes(antecipacoesRows);
    setMediaSemanal(mediaSemanalCalc);
    setLoading(false);
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const hojeIso = toIso(new Date());
  const diaHoje = dias.find((d) => d.data === hojeIso);
  const saldoHoje = diaHoje ? diaHoje.entradas - diaHoje.saidas : 0;

  const totalAVencer = aVencer.reduce((s, c) => s + (Number(c.saldo) || Number(c.valor) || 0), 0);

  // Cada conta pode ter sido atualizada num dia diferente (ex: Banrisul hoje,
  // Sicredi 3 dias atras) -- a data de referencia da projecao usa a mais
  // recente entre elas (a informacao mais fresca que temos), mesmo que
  // alguma conta individual esteja um pouco desatualizada.
  const dataSaldoCaixa =
    saldoCaixaLinhas.length > 0
      ? saldoCaixaLinhas.reduce((max, r) => (r.data_referencia > max ? r.data_referencia : max), saldoCaixaLinhas[0].data_referencia)
      : null;
  const saldoCaixaReal = dataSaldoCaixa != null ? saldoCaixaLinhas.reduce((s, r) => s + Number(r.valor), 0) : null;

  // Fluxo acumulado a partir do saldo real registrado (se houver) -- trata o
  // registro como saldo de ABERTURA daquele dia, entao soma o movimento do
  // proprio dia do registro em diante (inclui pagamentos de hoje ainda nao
  // feitos, se voce registrou o saldo antes de pagar). Sem registro, assume
  // R$0 e so mostra a tendencia dos proximos dias, nao um valor real.
  const diasParaAcumular =
    dataSaldoCaixa != null ? dias.filter((d) => d.data >= dataSaldoCaixa) : dias.filter((d) => d.data > hojeIso);

  let acumulado = saldoCaixaReal ?? 0;
  let diaFicaNegativo = null;
  for (const d of diasParaAcumular) {
    acumulado += d.entradas - d.saidas;
    if (acumulado < 0 && !diaFicaNegativo) diaFicaNegativo = d.data;
  }

  const mesesDeMetaAteAgora = mesesEntre(INICIO_META_RESERVA, new Date()) + 1;
  const metaMin = mesesDeMetaAteAgora * META_RESERVA_MIN;
  const metaMax = mesesDeMetaAteAgora * META_RESERVA_MAX;
  const saldoReservaReal = reserva ? Number(reserva.valor) : null;
  const deficitReservaMin = saldoReservaReal != null ? metaMin - saldoReservaReal : null;
  const deficitReservaMax = saldoReservaReal != null ? metaMax - saldoReservaReal : null;

  // Custo acumulado de antecipar recebiveis por falta de caixa -- "o preco de
  // nao ter reserva", desde que comecamos a registrar (nao e retroativo).
  const totalTaxaAntecipacao = antecipacoes.reduce((s, a) => s + (Number(a.taxa_paga) || 0), 0);
  const totalAntecipado = antecipacoes.reduce((s, a) => s + (Number(a.valor_antecipado) || 0), 0);

  const totalEstimadoProjecao = dias
    .filter((d) => d.data > hojeIso)
    .reduce((s, d) => s + (d.estimado || 0), 0);

  return (
    <div>
      <PageHeader
        eyebrow="Painel financeiro"
        title="Visão geral"
        subtitle="O que precisa de atenção agora. Entradas já consideram o prazo real de liquidação (débito D+1, crédito D+30, iFood ~1 semana)."
      />

      <p className="callout">
        <strong>&quot;Contas a vencer&quot; só mostra o que já está lançado no sistema.</strong> Se uma conta ainda não
        foi cadastrada no Memória Info, não aparece aqui nem entra na projeção — o &quot;saldo das contas&quot; abaixo
        é atualizado por você e ajuda a cobrir esse ponto cego pra qualquer coisa que ainda não foi lançada.
      </p>

      <p className="callout">
        <strong>A projeção dos próximos {DIAS_PROJECAO} dias inclui vendas que ainda vão acontecer</strong> (não só o
        que já foi vendido e está esperando liquidar): usa a média de faturamento de cada dia da semana nas últimas{' '}
        {SEMANAS_MEDIA} semanas, por forma de pagamento, aplicando o prazo de cada uma (dinheiro/PIX mesmo dia, débito
        D+1, crédito D+30, iFood na próxima quarta-feira). É estimativa — feriados, eventos ou um dia fora do padrão
        vão variar. A tabela &quot;Ver como tabela&quot; abaixo mostra a média usada dia a dia.
      </p>

      {error && <p className="error-text">{error}</p>}
      {loading && <p className="muted">Carregando...</p>}

      {!loading && !error && (
        <>
          <div className="cards-row" style={{ alignItems: 'flex-start' }}>
            <div>
              <SummaryCard
                label="Saldo das contas (real)"
                value={saldoCaixaReal != null ? formatBRL(saldoCaixaReal) : 'sem registro'}
                tone={saldoCaixaReal != null && saldoCaixaReal < 0 ? 'negativo' : undefined}
              />
              {saldoCaixaLinhas.length > 0 && (
                <ul style={{ listStyle: 'none', margin: '0.5rem 0 0', padding: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {saldoCaixaLinhas.map((l) => (
                    <li key={l.conta} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                      <span>
                        {l.conta}
                        {l.data_referencia !== dataSaldoCaixa && (
                          <span style={{ opacity: 0.7 }}> ({formatDataBR(l.data_referencia).slice(0, 5)})</span>
                        )}
                      </span>
                      <span>{formatBRL(l.valor)}</span>
                    </li>
                  ))}
                </ul>
              )}
              <div style={{ marginTop: '0.5rem' }}>
                <SaldoCaixaForm onSalvo={carregar} />
              </div>
            </div>
            <SummaryCard label="Saldo de hoje (movimento)" value={formatBRL(saldoHoje)} tone={saldoHoje >= 0 ? 'positivo' : 'negativo'} />
            <SummaryCard
              label={`Contas a vencer (${DIAS_PROJECAO}d)`}
              value={`${formatBRL(totalAVencer)} (${aVencer.length})`}
              tone={aVencer.length > 0 ? 'negativo' : undefined}
            />
            <SummaryCard
              label="Fluxo acumulado (7d)"
              value={diaFicaNegativo ? `Fica negativo em ${formatDataBR(diaFicaNegativo).slice(0, 5)}` : 'Sem dias negativos'}
              tone={diaFicaNegativo ? 'negativo' : 'positivo'}
            />
          </div>

          {dataSaldoCaixa && (
            <p className="muted" style={{ marginTop: '-0.75rem', marginBottom: '1rem' }}>
              Saldo registrado em {formatDataBR(dataSaldoCaixa)} (saldo de abertura daquele dia), projetado pro fluxo
              com base no movimento sincronizado desde então.
            </p>
          )}

          <div className="cards-row">
            <SummaryCard
              href="/saude"
              label={ultimoMesDre ? `Resultado líquido (${formatDataBR(ultimoMesDre.mes).slice(3)}) →` : 'Resultado líquido →'}
              value={ultimoMesDre ? formatBRL(ultimoMesDre.resultadoLiquido) : '-'}
              tone={ultimoMesDre && ultimoMesDre.resultadoLiquido >= 0 ? 'positivo' : 'negativo'}
            />
            <SummaryCard
              href="/saude"
              label="CMV do último mês →"
              value={ultimoMesDre ? `${ultimoMesDre.cmvPct.toFixed(1)}%` : '-'}
            />
            <SummaryCard
              href="/divida-reserva"
              label="Déficit da reserva vs. meta →"
              value={saldoReservaReal != null ? `${formatBRL(deficitReservaMin)} – ${formatBRL(deficitReservaMax)}` : 'sem registro'}
              tone={deficitReservaMin > 0 ? 'negativo' : 'positivo'}
            />
          </div>

          {aVencer.length > 0 && (
            <p className="muted" style={{ marginBottom: '1.5rem' }}>
              Próxima a vencer: <strong>{aVencer[0].fornecedor || 'sem fornecedor'}</strong> —{' '}
              {formatBRL(aVencer[0].saldo || aVencer[0].valor)} em {formatDataBR(aVencer[0].data_vencimento)}.{' '}
              <Link href="/contas-a-pagar">Ver todas →</Link>
            </p>
          )}

          <div className="surface">
            <div className="section-title">Histórico e projeção</div>
            <p className="section-note">
              Últimos {DIAS_HISTORICO} dias (fato) + próximos {DIAS_PROJECAO} dias (vendas já feitas ainda não
              liquidadas + estimativa de vendas futuras, {formatBRL(totalEstimadoProjecao)} no total do período +
              contas já com vencimento definido — não é garantido).
            </p>
            <CaixaChart dias={dias} />

            <details style={{ marginTop: '1rem' }}>
              <summary style={{ cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Ver a média por dia da semana usada na projeção
              </summary>
              <div style={{ overflowX: 'auto', marginTop: '0.5rem' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Dia</th>
                      {CATEGORIAS_PAGAMENTO.map((c) => (
                        <th key={c} className="text-right">
                          {c}
                        </th>
                      ))}
                      <th className="text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mediaSemanal.map((l) => (
                      <tr key={l.weekday}>
                        <td>
                          {l.label}
                          {l.total === 0 && <span className="muted"> (fechado)</span>}
                        </td>
                        {CATEGORIAS_PAGAMENTO.map((c) => (
                          <td key={c} className="text-right">
                            {l[c] ? formatBRL(l[c]) : '-'}
                          </td>
                        ))}
                        <td className="text-right" style={{ fontWeight: 600 }}>
                          {formatBRL(l.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </div>

          <div className="surface">
            <div className="section-title">Antecipações</div>
            <p className="section-note">
              O preço de não ter reserva: cada vez que falta caixa e você antecipa recebíveis de cartão pra cobrir,
              registra aqui. Total desde que começamos a registrar (não é retroativo).
            </p>
            <div className="cards-row" style={{ marginBottom: antecipacoes.length > 0 ? '1rem' : 0 }}>
              <SummaryCard label="Total antecipado" value={formatBRL(totalAntecipado)} />
              <SummaryCard label="Total pago em taxa" value={formatBRL(totalTaxaAntecipacao)} tone={totalTaxaAntecipacao > 0 ? 'negativo' : undefined} />
            </div>
            {antecipacoes.length > 0 && (
              <div style={{ overflowX: 'auto', marginBottom: '1rem' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Conta</th>
                      <th className="text-right">Antecipado</th>
                      <th className="text-right">Possível</th>
                      <th className="text-right">Taxa paga</th>
                      <th>Observação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {antecipacoes.map((a) => (
                      <tr key={a.id}>
                        <td>{formatDataBR(a.data_referencia)}</td>
                        <td>{a.conta || '-'}</td>
                        <td className="text-right">{formatBRL(a.valor_antecipado)}</td>
                        <td className="text-right">{a.valor_possivel != null ? formatBRL(a.valor_possivel) : '-'}</td>
                        <td className="text-right num-negativo">{formatBRL(a.taxa_paga)}</td>
                        <td className="muted">{a.observacao || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <AntecipacaoForm onSalvo={carregar} />
          </div>
        </>
      )}
    </div>
  );
}
