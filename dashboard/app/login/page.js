'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (signInError) {
      setError('E-mail ou senha incorretos.');
      return;
    }

    router.push('/caixa');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="auth-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.25rem' }}>
        <div className="sidebar-logo">V</div>
        <div>
          <div className="sidebar-brand-name">Veneza</div>
          <div className="sidebar-brand-sub">Painel financeiro</div>
        </div>
      </div>
      <input
        type="email"
        placeholder="E-mail"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Senha"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      {error && <p className="error-text" style={{ margin: 0, fontSize: '0.85rem' }}>{error}</p>}
      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  );
}
