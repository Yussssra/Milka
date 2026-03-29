export const businessData = {
  businessName: 'Shawok Grill',
  summary: {
    revenue: 312000,
    revenueChange: '+8.4% vs last week',
    expenses: 221400,
    expenseChange: '+14.1% vs last week',
    profit: 90600,
    profitChange: '-4.8% vs last week',
    inventoryRiskCount: 3,
    inventoryRiskText: 'Chicken, oil, packaging',
    insightHeadline: 'Sales are up, but margin is being squeezed by utilities and over-ordering.',
    insightBody: 'Dinner sales improved on Friday and Saturday, but profit did not rise at the same pace because electricity cost spiked and chicken purchasing ran ahead of forecast demand.'
  },
  forecast: [
    { day: 'Mon', sales: 41000 },
    { day: 'Tue', sales: 43500 },
    { day: 'Wed', sales: 45200 },
    { day: 'Thu', sales: 46800 },
    { day: 'Fri', sales: 51200 },
    { day: 'Sat', sales: 55600 },
    { day: 'Sun', sales: 48900 }
  ],
  inventory: [
    { name: 'Chicken', currentStock: 92, forecastRequirement: 81, unit: 'kg' },
    { name: 'Cooking Oil', currentStock: 46, forecastRequirement: 59, unit: 'liters' },
    { name: 'Burger Buns', currentStock: 520, forecastRequirement: 440, unit: 'pcs' },
    { name: 'Packaging', currentStock: 380, forecastRequirement: 520, unit: 'pcs' }
  ],
  expenseAnomalies: [
    {
      category: 'Electricity',
      actual: 31800,
      expected: 24100,
      message: 'Electricity cost is 32% above the four-week baseline. Check freezer efficiency, AC run-time, and peak-hour usage.'
    }
  ]
};
