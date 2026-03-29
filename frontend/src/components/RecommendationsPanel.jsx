export function RecommendationsPanel({ recommendations, anomalies }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="panel p-6">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Recommendations</p>
        <div className="mt-5 space-y-4">
          {recommendations.map((item) => (
            <div key={item.title} className="rounded-2xl bg-sand p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-display text-lg text-ink">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{item.reason}</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-ember">{item.type}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="panel p-6">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Anomalies</p>
        <div className="mt-5 space-y-4">
          {anomalies.map((item) => (
            <div key={item.category} className="rounded-2xl border border-red-200 bg-red-50 p-4">
              <h3 className="font-display text-lg text-red-900">{item.category}</h3>
              <p className="mt-2 text-sm leading-6 text-red-800">{item.message}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
