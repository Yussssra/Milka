import { businessData } from './data/businessData.js';

export function buildInventoryRecommendations() {
  return businessData.inventory.map((item) => {
    const delta = item.currentStock - item.forecastRequirement;
    if (delta > 0) {
      const percent = Math.round((delta / item.currentStock) * 100);
      return {
        ...item,
        action: `Reduce buy by ${percent}%`
      };
    }

    const percent = Math.round((Math.abs(delta) / item.forecastRequirement) * 100);
    return {
      ...item,
      action: `Increase buy by ${percent}%`
    };
  });
}

export function buildRecommendations() {
  const inventoryRecommendations = buildInventoryRecommendations();
  const chicken = inventoryRecommendations.find((item) => item.name === 'Chicken');

  return [
    {
      type: 'Inventory',
      title: `${chicken.name}: ${chicken.action}`,
      reason: `Current stock is ${chicken.currentStock} ${chicken.unit} against a projected need of ${chicken.forecastRequirement} ${chicken.unit}, which ties up cash and increases spoilage risk.`
    },
    {
      type: 'Cost',
      title: 'Investigate electricity cost spike',
      reason: businessData.expenseAnomalies[0].message
    },
    {
      type: 'Profit',
      title: 'Protect weekend margin with combo pricing',
      reason: 'Weekend demand is healthy. Raising average order value through bundles is likely to improve profit faster than pushing more volume alone.'
    }
  ];
}

export function buildDashboardPayload() {
  return {
    summary: businessData.summary,
    forecast: businessData.forecast,
    anomalies: businessData.expenseAnomalies,
    inventoryRecommendations: buildInventoryRecommendations(),
    recommendations: buildRecommendations()
  };
}

export function answerQuestion(question) {
  const lower = question.toLowerCase();

  if (lower.includes('profit')) {
    return 'Profit is lower this week because expenses grew faster than revenue. The main drivers are a sharp electricity spike and excess chicken purchasing, which increased cost without matching sales output.';
  }

  if (lower.includes('stock') || lower.includes('inventory')) {
    return 'Cooking oil and packaging need attention first because forecast demand is above current stock. Chicken is the opposite case: it is overstocked relative to expected consumption, so procurement should be reduced.';
  }

  if (lower.includes('cost') || lower.includes('abnormal') || lower.includes('anomaly')) {
    return businessData.expenseAnomalies[0].message;
  }

  return 'The strongest current signal is margin pressure: revenue is improving, but utility cost and inventory mismatch are keeping profit growth below expectations. This is a good place to start operational cleanup.';
}
