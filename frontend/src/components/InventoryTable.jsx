export function InventoryTable({ items }) {
  return (
    <div className="panel p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Inventory</p>
          <h2 className="mt-2 font-display text-2xl text-ink">Stock actions for this week</h2>
        </div>
      </div>
      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="text-slate-500">
            <tr>
              <th className="pb-4 pr-4">Item</th>
              <th className="pb-4 pr-4">On hand</th>
              <th className="pb-4 pr-4">Forecast need</th>
              <th className="pb-4 pr-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.name} className="border-t border-slate-200/70 text-ink">
                <td className="py-4 pr-4 font-semibold">{item.name}</td>
                <td className="py-4 pr-4">{item.currentStock} {item.unit}</td>
                <td className="py-4 pr-4">{item.forecastRequirement} {item.unit}</td>
                <td className="py-4 pr-4">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.action.includes('Reduce') ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'}`}>
                    {item.action}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
