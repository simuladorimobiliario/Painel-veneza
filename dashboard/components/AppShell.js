'use client';

import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';

export default function AppShell({ children }) {
  const pathname = usePathname();

  if (pathname === '/login') {
    return <div className="auth-shell">{children}</div>;
  }

  return (
    <div className="shell">
      <Sidebar />
      <main className="main">{children}</main>
    </div>
  );
}
