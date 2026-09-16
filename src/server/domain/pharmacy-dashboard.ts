export function pharmacyDashboardRates(input: {
  queueLength: number;
  dispensedFull: number;
  dispensedPartial: number;
  lowStockCount: number;
  nearExpiryCount: number;
}) {
  const totalDispensed = input.dispensedFull + input.dispensedPartial;
  return {
    ...input,
    totalDispensed,
    partialRate: totalDispensed ? Math.round((input.dispensedPartial / totalDispensed) * 100) : 0,
    riskCount: input.lowStockCount + input.nearExpiryCount,
  };
}
