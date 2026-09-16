"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { AppLayout } from "@/components/shared/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Dashboard = {
  queueLength: number;
  dispensedToday: number;
  dispensedPartial: number;
  partialRate: number;
  riskCount: number;
  stockLevels: Array<{ locationId: string; locationName: string; quantity: number }>;
  nearExpiryBatches: Array<{
    id: string;
    lotNumber: string;
    expiryDate: string;
    quantityAvailable: number;
    item: { name: string };
    location: { name: string };
  }>;
  openAlerts: Array<{
    id: string;
    currentQuantity: number;
    threshold: number;
    status: string;
    item: { name: string };
    location: { name: string };
  }>;
};

export default function PharmacyDashboardPage() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/dashboard/pharmacy")
      .then((response) => setDashboard(response.data.data))
      .catch(() => setError("Dashboard data is temporarily unavailable."));
  }, []);

  return (
    <AppLayout>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-semibold">Pharmacy & Inventory Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Live prescription, dispensing, stock, alert and batch-risk indicators.
          </p>
        </div>
        {error && <div className="rounded-md bg-red-50 p-4 text-red-700">{error}</div>}
        {!dashboard ? (
          <p>Loading operational metrics…</p>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-5">
              {[
                ["Pending prescriptions", dashboard.queueLength],
                ["Dispensed today", dashboard.dispensedToday],
                ["Partial dispenses", dashboard.dispensedPartial],
                ["Partial rate", `${dashboard.partialRate}%`],
                ["Operational risks", dashboard.riskCount],
              ].map(([label, value]) => (
                <Card key={String(label)}>
                  <CardHeader>
                    <CardTitle className="text-sm">{label}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-3xl font-semibold">{value}</CardContent>
                </Card>
              ))}
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Low-stock alerts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {dashboard.openAlerts.length ? (
                    dashboard.openAlerts.map((alert) => (
                      <div key={alert.id} className="flex justify-between border-b pb-2">
                        <span>
                          {alert.item.name}
                          <small className="block text-muted-foreground">
                            {alert.location.name}
                          </small>
                        </span>
                        <strong>
                          {alert.currentQuantity} / {alert.threshold}
                        </strong>
                      </div>
                    ))
                  ) : (
                    <p>No open alerts.</p>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Expiry and batch risks</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {dashboard.nearExpiryBatches.length ? (
                    dashboard.nearExpiryBatches.map((batch) => (
                      <div key={batch.id} className="flex justify-between border-b pb-2">
                        <span>
                          {batch.item.name}
                          <small className="block text-muted-foreground">
                            {batch.location.name} · {batch.lotNumber}
                          </small>
                        </span>
                        <strong>{new Date(batch.expiryDate).toLocaleDateString()}</strong>
                      </div>
                    ))
                  ) : (
                    <p>No near-expiry batches.</p>
                  )}
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Stock by location</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-3">
                {dashboard.stockLevels.map((stock) => (
                  <div key={stock.locationId} className="rounded-md border p-4">
                    <p className="text-sm text-muted-foreground">{stock.locationName}</p>
                    <p className="text-2xl font-semibold">{stock.quantity}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppLayout>
  );
}
