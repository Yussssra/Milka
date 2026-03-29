function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value);
}

export function MetricCard({ label, value, change, tone = 'default' }) {
  const changeTone = tone === 'danger' ? 'text-red-600' : tone === 'success' ? 'text-emerald-700' : 'text-slate-600';

  return (
    <article className="metric-card">
      <p className="text-sm uppercase tracking-[0.24em] text-slate-500">{label}</p>
      <div className="mt-4 flex items-end justify-between gap-4">
        <h3 className="font-display text-3xl text-ink">{typeof value === 'number' ? formatCurrency(value) : value}</h3>
        <span className={`text-sm font-semibold ${changeTone}`}>{change}</span>
      </div>
    </article>
  );
}
