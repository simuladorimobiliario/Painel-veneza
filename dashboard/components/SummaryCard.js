import Link from 'next/link';

export default function SummaryCard({ label, value, tone, href }) {
  const toneClass = tone === 'negativo' ? ' negativo' : tone === 'positivo' ? ' positivo' : '';

  const content = (
    <div className="card stat-card">
      <div className="stat-label">{label}</div>
      <div className={`stat-value${toneClass}`}>{value}</div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="stat-card-link">
        {content}
      </Link>
    );
  }

  return content;
}
