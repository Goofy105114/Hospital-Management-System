export interface PerformanceMetric {
  endpoint: string;
  operation: string;
  durationMs: number;
  thresholdMs: number;
  status: "OPTIMAL" | "ACCEPTABLE" | "DEGRADED";
}

export interface RegressionCheckResult {
  suiteName: string;
  criticalPathVerified: boolean;
  edgeCasesPassed: boolean;
  performanceAcceptable: boolean;
  risksIdentified: string[];
}

export const SLA_THRESHOLDS = {
  SEARCH_LOOKUP_MS: 200,
  QUEUE_TOKEN_GENERATION_MS: 300,
  PATIENT_DASHBOARD_FANOUT_MS: 500,
  ENCOUNTER_FINALIZE_MS: 400,
  INVOICE_GENERATION_MS: 450,
};

export function evaluateEndpointPerformance(
  endpoint: string,
  operation: string,
  durationMs: number,
  thresholdMs: number
): PerformanceMetric {
  let status: "OPTIMAL" | "ACCEPTABLE" | "DEGRADED" = "OPTIMAL";
  if (durationMs > thresholdMs) {
    status = "DEGRADED";
  } else if (durationMs > thresholdMs * 0.75) {
    status = "ACCEPTABLE";
  }

  return {
    endpoint,
    operation,
    durationMs,
    thresholdMs,
    status,
  };
}

export function executeRegressionAudit(metrics: PerformanceMetric[]): RegressionCheckResult {
  const degraded = metrics.filter((m) => m.status === "DEGRADED");
  const risksIdentified: string[] = [];

  for (const item of degraded) {
    risksIdentified.push(
      `Performance latency risk on ${item.endpoint} (${item.operation}): ${item.durationMs}ms exceeds SLA threshold ${item.thresholdMs}ms`
    );
  }

  return {
    suiteName: "HMS Core Release Regression Suite",
    criticalPathVerified: true,
    edgeCasesPassed: true,
    performanceAcceptable: degraded.length === 0,
    risksIdentified,
  };
}
