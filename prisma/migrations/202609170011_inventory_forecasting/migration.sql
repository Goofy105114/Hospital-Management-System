CREATE INDEX IF NOT EXISTS reorder_suggestion_location_idx
ON "ReorderSuggestion" ("locationId", "generatedAt");
