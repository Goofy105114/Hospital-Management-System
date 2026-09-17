CREATE UNIQUE INDEX IF NOT EXISTS one_active_stock_alert_per_item_location
ON "StockAlert" ("itemId", "locationId")
WHERE status IN ('OPEN', 'ACKNOWLEDGED');
