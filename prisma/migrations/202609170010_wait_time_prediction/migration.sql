CREATE INDEX IF NOT EXISTS ai_prediction_evaluation_idx
ON "AiPredictionLog" ("predictionType", "subjectId", "createdAt");
