import { BatchStatus, StockMovementReason } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { forecastReorder } from "@/server/domain/inventory-forecast";

export class InventoryForecastService {
  static async suggestions(locationId: string) {
    const location = await prisma.stockLocation.findFirst({
      where: { id: locationId, isActive: true },
    });
    if (!location) return { success: false as const, code: "INV_LOCATION_NOT_FOUND", status: 404 };
    const cutoff = new Date(Date.now() - 90 * 86_400_000);
    const [consumption, thresholds, stock] = await Promise.all([
      prisma.stockLedgerEntry.groupBy({
        by: ["itemId"],
        where: {
          locationId,
          reason: StockMovementReason.DISPENSE,
          quantityDelta: { lt: 0 },
          createdAt: { gte: cutoff },
        },
        _sum: { quantityDelta: true },
        _count: { _all: true },
        _min: { createdAt: true },
      }),
      prisma.reorderThreshold.findMany({ where: { locationId }, include: { item: true } }),
      prisma.stockBatch.groupBy({
        by: ["itemId"],
        where: { locationId, status: BatchStatus.ACTIVE, expiryDate: { gt: new Date() } },
        _sum: { quantityAvailable: true },
      }),
    ]);
    const consumptionByItem = new Map(consumption.map((row) => [row.itemId, row]));
    const stockByItem = new Map(stock.map((row) => [row.itemId, row._sum.quantityAvailable ?? 0]));
    const itemIds = new Set([
      ...thresholds.map((row) => row.itemId),
      ...consumption.map((row) => row.itemId),
    ]);
    const missingItems = await prisma.inventoryItem.findMany({
      where: { id: { in: [...itemIds] }, isActive: true },
    });
    const itemById = new Map(missingItems.map((item) => [item.id, item]));
    const thresholdByItem = new Map(thresholds.map((threshold) => [threshold.itemId, threshold]));
    const results = [];
    for (const itemId of itemIds) {
      const item = itemById.get(itemId);
      if (!item) continue;
      const usage = consumptionByItem.get(itemId);
      const first = usage?._min.createdAt ?? cutoff;
      const historyDays = Math.max(1, Math.ceil((Date.now() - first.getTime()) / 86_400_000));
      const threshold = thresholdByItem.get(itemId);
      const currentQuantity = stockByItem.get(itemId) ?? 0;
      const forecast = forecastReorder({
        consumedQuantity: Math.abs(usage?._sum.quantityDelta ?? 0),
        historyDays,
        consumptionEvents: usage?._count._all ?? 0,
        currentQuantity,
        leadTimeDays: 14,
        safetyStockDays: threshold
          ? Math.max(
              7,
              Math.ceil(
                threshold.minQuantity /
                  Math.max(1, Math.abs(usage?._sum.quantityDelta ?? 0) / historyDays)
              )
            )
          : 7,
      });
      const inputs = {
        historyDays,
        consumptionEvents: usage?._count._all ?? 0,
        consumedQuantity: Math.abs(usage?._sum.quantityDelta ?? 0),
        currentQuantity,
        leadTimeDays: 14,
      };
      const persisted = await prisma.reorderSuggestion.create({
        data: {
          itemId,
          locationId,
          suggestedQuantity: forecast.suggestedQuantity,
          averageDailyDemand: forecast.averageDailyDemand,
          currentQuantity,
          confidence: forecast.confidence,
          source: "moving_average_fallback",
          lowConfidence: forecast.lowConfidence,
          inputs,
          expiresAt: new Date(Date.now() + 24 * 60 * 60_000),
        },
      });
      await prisma.aiPredictionLog.create({
        data: {
          predictionType: "INVENTORY_DEMAND",
          subjectId: `${itemId}:${locationId}`,
          inputs,
          output: {
            suggestedQuantity: forecast.suggestedQuantity,
            averageDailyDemand: forecast.averageDailyDemand,
          },
          source: "fallback",
          confidence: forecast.confidence,
        },
      });
      results.push({
        suggestionId: persisted.id,
        itemId,
        itemName: item.name,
        suggestedQuantity: forecast.suggestedQuantity,
        averageDailyDemand: forecast.averageDailyDemand,
        confidence: forecast.confidence,
        lowConfidence: forecast.lowConfidence,
        source: "fallback",
        advisory: true,
        currentQuantity,
      });
    }
    return { success: true as const, data: results };
  }
}
