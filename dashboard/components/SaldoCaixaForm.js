'use client';

import { useState } from 'react';
import { createClient } from '../lib/supabase/client';

function toIso(d) {
  return d.toISOString().slice(0, 10);
}

// As 4 contas reais que o Fernando movimenta: 3 bancos (mesmos das dividas em
// /divida-reserva) + dinheiro em caixa. Cada "salvar" grava uma linha por
// conta com a mesma data_referencia -- a tela soma essas linhas pra achar o
// saldo total do dia mais recente.
export const CONTAS = ['Santander', 'Banrisul', 'Sicredi', 'Caixa'];

// Registro manual pontual (nao sincronizado) do saldo real de cada conta --
// pra projecao de fluxo de caixa partir de um numero de verdade em vez de
// assumir R$0.
export default function SaldoCaixaForm({ onSalvo }) {
  const [aberto, setAberto] = useState(false);
  const [valores, setValores] = useState(() => Object.fromEntries(CONTAS.map((c) => [c, ''])));
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);

  async function salvar(e) {
    e.preventDefault();

    const linhas = [];
    for (const conta of CONTAS) {
      const bruto = valores[conta];
      if (bruto === '' || bruto == null) continue;
      const num = Number(String(bruto).replace(',', '.'));
      if (Number.isNaN(num)) {
        setErro(`Valor inválido em ${conta}`);
        return;
      }
      linhas.push({ data_referencia: toIso(new Date()), conta, valor: num });
    }

    if (linhas.length === 0) {
      setErro('Preencha ao menos uma conta');
      return;
    }

    setSalvando(true);
    setErro(null);

    const supabase = createClient();
    const { error } = await supabase.from('saldo_caixa').insert(linhas);

    setSalvando(false);

    if (error) {
      setErro(error.message);
      return;
    }

    setValores(Object.fromEntries(CONTAS.map((c) => [c, ''])));
    setAberto(false);
    onSalvo?.();
  }

  if (!aberto) {
    return (
      <button type="button" className="btn-secondary" onClick={() => setAberto(true)}>
        Atualizar saldo das contas
      </button>
    );
  }

  return (
    <form onSubmit={salvar} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: 320 }}>
      {CONTAS.map((conta) => (
        <div key={conta} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ width: 90, fontSize: '0.85rem', color: 'var(--text-muted)' }}>{conta}</label>
          <input
            type="text"
            inputMode="decimal"
            placeholder="R$"
            value={valores[conta]}
            onChange={(e) => setValores((v) => ({ ...v, [conta]: e.target.value }))}
            style={{ flex: 1, padding: '0.4rem 0.6rem', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.85rem' }}
          />
        </div>
      ))}
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
