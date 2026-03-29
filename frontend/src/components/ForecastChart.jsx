export function ForecastChart({ forecast }) {
  const maxValue = Math.max(...forecast.map((item) => item.sales));

  return (
    <div className="panel p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Forecast</p>
          <h2 className="mt-2 font-display text-2xl text-ink">Next 7 days sales outlook</h2>
        </div>
        <span className="rounded-full bg-amber-100 px-4 py-2 text-sm font-medium text-amber-900">Model-ready placeholder</span>
      </div>
      <div className="mt-8 flex h-64 items-end gap-3">
        {forecast.map((item) => {
          const height = `${Math.max((item.sales / maxValue) * 100, 18)}%`;
          return (
            <div key={item.day} className="flex flex-1 flex-col items-center gap-3">
              <div className="flex h-full w-full items-end">
                <div className="w-full rounded-t-3xl bg-gradient-to-t from-ember to-gold" style={{ height }}></div>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-ink">{item.day}</p>
                <p className="text-xs text-slate-500">INR {item.sales.toLocaleString('en-IN')}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
