import { useEffect, useState } from 'react';
import { MetricCard } from './components/MetricCard';
import { ForecastChart } from './components/ForecastChart';
import { InventoryTable } from './components/InventoryTable';
import { RecommendationsPanel } from './components/RecommendationsPanel';
import { ChatPanel } from './components/ChatPanel';
import { fetchDashboard } from './lib/api';

function App() {
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboard()
      .then(setDashboard)
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return <div className="p-8 text-red-700">{error}</div>;
  }

  if (!dashboard) {
    return <div className="p-8 text-slate-600">Loading business dashboard...</div>;
  }

  const { summary, forecast, inventoryRecommendations, recommendations, anomalies } = dashboard;

  return (
    <div className="grid-hero min-h-screen px-4 py-6 text-ink sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="panel overflow-hidden px-6 py-8 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div>
              <p className="text-sm uppercase tracking-[0.32em] text-slate-500">OpsPilot</p>
              <h1 className="mt-4 max-w-3xl font-display text-4xl leading-tight text-ink sm:text-5xl">
                A decision-making assistant for small businesses that explains what changed and what to do next.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-700">
                This MVP tracks sales, expenses, inventory, projected demand, and abnormal cost behavior. It is designed so we can connect your real Shawok data next.
              </p>
            </div>
            <div className="rounded-[2rem] bg-ink p-6 text-sand">
              <p className="text-sm uppercase tracking-[0.24em] text-sand/60">This week</p>
              <p className="mt-4 font-display text-3xl">{summary.insightHeadline}</p>
              <p className="mt-4 text-sm leading-7 text-sand/80">{summary.insightBody}</p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Revenue" value={summary.revenue} change={summary.revenueChange} tone="success" />
          <MetricCard label="Expenses" value={summary.expenses} change={summary.expenseChange} tone="danger" />
          <MetricCard label="Profit" value={summary.profit} change={summary.profitChange} tone={summary.profit >= 0 ? 'success' : 'danger'} />
          <MetricCard label="Inventory at Risk" value={`${summary.inventoryRiskCount} items`} change={summary.inventoryRiskText} />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <ForecastChart forecast={forecast} />
          <InventoryTable items={inventoryRecommendations} />
        </section>

        <RecommendationsPanel recommendations={recommendations} anomalies={anomalies} />
        <ChatPanel />
      </div>
    </div>
  );
}

export default App;
