import { NextRequest } from "next/server";
import { StockAlertStatus } from "@prisma/client";
import { apiError, apiSuccess } from "@/lib/api-envelope";
import { prisma } from "@/lib/prisma";
import { authorizeInventoryManager } from "../route-auth";

export async function GET(request: NextRequest) {
  const auth = authorizeInventoryManager(request);
  if (auth.error) return auth.error;
  const statusParam = new URL(request.url).searchParams.get("status");
  const status =
    statusParam && Object.values(StockAlertStatus).includes(statusParam as StockAlertStatus)
      ? (statusParam as StockAlertStatus)
      : undefined;
  if (statusParam && !status) return apiError("INV_INVALID_ALERT_STATUS", "Invalid status", 400);
  const alerts = await prisma.stockAlert.findMany({
    where: status ? { status } : {},
    include: { item: { select: { name: true, unit: true } }, location: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return apiSuccess(alerts);
}
