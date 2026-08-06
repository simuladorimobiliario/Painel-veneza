'use client';

import { useState } from 'react';
import { createClient } from '../lib/supabase/client';

function toIso(d) {
  return d.toISOString().slice(0, 10);
}

function parseNum(v) {
  if (v === '' || v == null) return null;
  const n = Number(String(v).replace(',', '.'));
  return Number.isNaN(n) ? undefined : n;
}

// Contas onde a antecipacao costuma cair -- geralmente Santander, as vezes
// Banrisul (confirmado com o Fernando 2026-08-06).
const CONTAS_ANTECIPACAO = ['Santander', 'Banrisul', 'Outro'];

// Registro manual de cada antecipacao de recebiveis (cartao) feita pra cobrir
// falta de caixa -- "o preco de nao ter reserva". valor_possivel e opcional
// (quanto dava pra antecipar no total), os dois campos que importam sao
// valor_antecipado e taxa_paga (custo em R$, nao %).
export default function AntecipacaoForm({ onSalvo }) {
  const [aberto, setAberto] = useState(false);
  const [valorAntecipado, setValorAntecipado] = useState('');
  const [valorPossivel, setValorPossivel] = useState('');
  const [taxaPaga, setTaxaPaga] = useState('');
  const [conta, setConta] = useState('Santander');
  const [observacao, setObservacao] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);

  async function salvar(e) {
    e.preventDefault();

    const nAntecipado = parseNum(valorAntecipado);
    const nPossivel = parseNum(valorPossivel);
    const nTaxa = parseNum(taxaPaga);

    if (nAntecipado == null || nAntecipado === undefined) {
      setErro('Informe o valor antecipado');
      return;
    }
    if (nTaxa == null || nTaxa === undefined) {
      setErro('Informe a taxa paga (R$)');
      return;
    }
    if (nPossivel === undefined) {
      setErro('Valor possível inválido');
      return;
    }

    setSalvando(true);
    setErro(null);

    const supabase = createClient();
    const { error } = await supabase.from('antecipacoes').insert({
      data_referencia: toIso(new Date()),
      valor_antecipado: nAntecipado,
      valor_possivel: nPossivel,
      taxa_paga: nTaxa,
      conta,
      observacao: observacao || null,
    });

    setSalvando(false);

    if (error) {
      setErro(error.message);
      return;
    }

    setValorAntecipado('');
    setValorPossivel('');
    setTaxaPaga('');
    setConta('Santander');
    setObservacao('');
    setAberto(false);
    onSalvo?.();
  }

  if (!aberto) {
    return (
      <button type="button" className="btn-secondary" onClick={() => setAberto(true)}>
        Registrar antecipação
      </button>
    );
  }

  return (
    <form onSubmit={salvar} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: 320 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <label style={{ width: 130, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Valor antecipado</label>
        <input
          type="text"
          inputMode="decimal"
          placeholder="R$"
          value={valorAntecipado}
          onChange={(e) => setValorAntecipado(e.target.value)}
          autoFocus
          style={{ flex: 1, padding: '0.4rem 0.6rem', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.85rem' }}
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <label style={{ width: 130, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Taxa paga (R$)</label>
        <input
          type="text"
          inputMode="decimal"
          placeholder="R$"
          value={taxaPaga}
          onChange={(e) => setTaxaPaga(e.target.value)}
          style={{ flex: 1, padding: '0.4rem 0.6rem', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.85rem' }}
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <label style={{ width: 130, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Conta</label>
        <select
          value={conta}
          onChange={(e) => setConta(e.target.value)}
          style={{ flex: 1, padding: '0.4rem 0.6rem', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.85rem' }}
        >
          {CONTAS_ANTECIPACAO.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <label style={{ width: 130, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Valor possível</label>
        <input
          type="text"
          inputMode="decimal"
          placeholder="R$ (opcional)"
          value={valorPossivel}
          onChange={(e) => setValorPossivel(e.target.value)}
          style={{ flex: 1, padding: '0.4rem 0.6rem', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.85rem' }}
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <label style={{ width: 130, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Observação</label>
        <input
          type="text"
          placeholder="opcional"
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
          style={{ flex: 1, padding: '0.4rem 0.6rem', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.85rem' }}
        />
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
        <button type="submit" className="btn-primary" disabled={salvando} style={{ padding: '0.4rem 0.8rem' }}>
          {salvando ? 'Salvando...' : 'Salvar'}
        </button>
        <button type="button" className="btn-secondary" onClick={() => setAberto(false)} disabled={salvando}>
          Cancelar
        </button>
      </div>
      {erro && (
        <span className="error-text" style={{ fontSize: '0.8rem' }}>
          {erro}
        </span>
      )}
    </form>
  );
}
