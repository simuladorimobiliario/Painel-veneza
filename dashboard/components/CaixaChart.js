'use client';

import { formatBRL, formatDataBR } from '../lib/format';

const COR_ENTRADA = '#2a78d6';
const COR_SAIDA = '#e34948';
const COR_EIXO = '#c3c2b7';
const COR_GRADE = '#e1e0d9';
const COR_TEXTO_MUTED = '#898781';

// Grafico de barras divergente: entradas pra cima, saidas pra baixo, a partir
// de uma linha de base no meio -- assim o saldo do dia fica visivel de cara.
export default function CaixaChart({ dias }) {
  if (dias.length === 0) {
    return <p style={{ color: COR_TEXTO_MUTED }}>Sem dados no periodo.</p>;
  }

  const maiorValor = Math.max(1, ...dias.map((d) => Math.max(d.entradas, d.saidas)));

  const largBarra = 14;
  const espacamento = 22;
  const altMetade = 120;
  const margemEsq = 8;
  const largura = margemEsq + dias.length * espacamento + 8;
  const altura = altMetade * 2 + 24;
  const baseY = altMetade + 12;

  return (
    <div>
      <svg viewBox={`0 0 ${largura} ${altura}`} style={{ width: '100%', height: 240 }} role="img" aria-label="Entradas e saidas por dia">
        <line x1={margemEsq} y1={baseY} x2={largura - 4} y2={baseY} stroke={COR_EIXO} strokeWidth={1} />
        {[0.5, 1].map((frac) => (
          <line
            key={frac}
            x1={margemEsq}
            x2={largura - 4}
            y1={baseY - altMetade * frac}
            y2={baseY - altMetade * frac}
            stroke={COR_GRADE}
            strokeWidth={1}
          />
        ))}
        {dias.map((d, i) => {
          const x = margemEsq + i * espacamento;
          const hEntrada = (d.entradas / maiorValor) * (altMetade - 4);
          const hSaida = (d.saidas / maiorValor) * (altMetade - 4);
          return (
            <g key={d.data}>
              <title>
                {formatDataBR(d.data)} — entradas {formatBRL(d.entradas)}, saidas {formatBRL(d.saidas)}, saldo{' '}
                {formatBRL(d.entradas - d.saidas)}
              </title>
              {hEntrada > 0 && (
                <rect x={x} y={baseY - hEntrada} width={largBarra} height={hEntrada} rx={4} fill={COR_ENTRADA} />
              )}
              {hSaida > 0 && <rect x={x} y={baseY} width={largBarra} height={hSaida} rx={4} fill={COR_SAIDA} />}
            </g>
          );
        })}
      </svg>

      <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem', marginTop: '0.5rem' }}>
        <span>
          <span style={{ display: 'inline-block', width: 10, height: 10, background: COR_ENTRADA, borderRadius: 2, marginRight: 6 }} />
          Entradas
        </span>
        <span>
          <span style={{ display: 'inline-block', width: 10, height: 10, background: COR_SAIDA, borderRadius: 2, marginRight: 6 }} />
          Saídas
        </span>
      </div>

      <details style={{ marginTop: '0.75rem' }}>
        <summary style={{ cursor: 'pointer', fontSize: '0.85rem', color: COR_TEXTO_MUTED }}>Ver como tabela</summary>
        <table style={{ marginTop: '0.5rem', borderCollapse: 'collapse', width: '100%', fontSize: '0.85rem' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '0.25rem 0' }}>Dia</th>
              <th style={{ textAlign: 'right', padding: '0.25rem 0' }}>Entradas</th>
              <th style={{ textAlign: 'right', padding: '0.25rem 0' }}>Saídas</th>
              <th style={{ textAlign: 'right', padding: '0.25rem 0' }}>Saldo</th>
            </tr>
          </thead>
          <tbody>
            {dias.map((d) => (
              <tr key={d.data}>
                <td style={{ padding: '0.15rem 0' }}>{formatDataBR(d.data)}</td>
                <td style={{ padding: '0.15rem 0', textAlign: 'right' }}>{formatBRL(d.entradas)}</td>
                <td style={{ padding: '0.15rem 0', textAlign: 'right' }}>{formatBRL(d.saidas)}</td>
                <td style={{ padding: '0.15rem 0', textAlign: 'right' }}>{formatBRL(d.entradas - d.saidas)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
