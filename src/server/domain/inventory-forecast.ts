export function forecastReorder(input: {
  consumedQuantity: number;
  historyDays: number;
  consumptionEvents: number;
  currentQuantity: number;
  leadTimeDays: number;
  safetyStockDays: number;
}) {
  const observedDays = Math.max(1, input.historyDays);
  const averageDailyDemand = Math.max(0, input.consumedQuantity / observedDays);
  const targetStock = averageDailyDemand * (input.leadTimeDays + input.safetyStockDays);
  const suggestedQuantity = Math.max(0, Math.ceil(targetStock - input.currentQuantity));
  const confidence = Math.min(
    0.95,
    Math.max(
      0.2,
      0.2 + Math.min(0.4, input.consumptionEvents / 50) + Math.min(0.35, observedDays / 180)
    )
  );
  return {
    averageDailyDemand: Math.round(averageDailyDemand * 100) / 100,
    suggestedQuantity,
    confidence: Math.round(confidence * 100) / 100,
    lowConfidence: confidence < 0.6,
    advisory: true,
  };
}
