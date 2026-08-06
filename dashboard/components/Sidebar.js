'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '../lib/supabase/client';
import {
  IconGrid,
  IconDollar,
  IconBarChart,
  IconActivity,
  IconShuffle,
  IconShield,
  IconFileText,
  IconLogOut,
  IconMenu,
  IconX,
} from './icons';

const NAV = [
  { href: '/caixa', label: 'Visão geral', Icon: IconGrid },
  { href: '/contas-a-pagar', label: 'Contas a pagar', Icon: IconDollar },
  { href: '/curva-abc', label: 'Curva ABC', Icon: IconBarChart },
  { href: '/saude', label: 'Saúde do negócio', Icon: IconActivity },
  { href: '/margem-canal', label: 'Margem por canal', Icon: IconShuffle },
  { href: '/divida-reserva', label: 'Dívida & Reserva', Icon: IconShield },
  { href: '/dre', label: 'DRE', Icon: IconFileText },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [aberto, setAberto] = useState(false);

  // Fecha o menu ao trocar de pagina (evita ficar aberto depois de navegar
  // pelo link no mobile).
  useEffect(() => {
    setAberto(false);
  }, [pathname]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        className="mobile-menu-btn"
        onClick={() => setAberto(true)}
        aria-label="Abrir menu"
      >
        <IconMenu />
      </button>

      {aberto && <div className="sidebar-backdrop" onClick={() => setAberto(false)} />}

      <aside className={`sidebar${aberto ? ' open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-logo">V</div>
          <div>
            <div className="sidebar-brand-name">Veneza</div>
            <div className="sidebar-brand-sub">Painel financeiro</div>
          </div>
          <button type="button" className="mobile-close-btn" onClick={() => setAberto(false)} aria-label="Fechar menu">
            <IconX />
          </button>
        </div>

        <nav className="sidebar-nav">
          {NAV.map(({ href, label, Icon }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href} className={`nav-link${active ? ' active' : ''}`}>
                <Icon />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button type="button" className="sidebar-signout" onClick={handleSignOut}>
            <IconLogOut />
            Sair
          </button>
        </div>
      </aside>
    </>
  );
}
