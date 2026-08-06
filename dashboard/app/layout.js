import './globals.css';
import AppShell from '../components/AppShell';

export const metadata = {
  title: 'Veneza',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
