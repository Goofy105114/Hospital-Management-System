import { describe, expect, it } from "vitest";
import {
  evaluateEndpointPerformance,
  executeRegressionAudit,
  SLA_THRESHOLDS,
  PerformanceMetric,
} from "@/server/domain/release-regression";

describe("REL-03 — Execute regression, smoke and performance checks", () => {
  describe("performance checks and SLA evaluation", () => {
    it("classifies sub-threshold latency as OPTIMAL", () => {
      const metric = evaluateEndpointPerformance(
        "/api/v1/queue/check-in",
        "Generate Token",
        120,
        SLA_THRESHOLDS.QUEUE_TOKEN_GENERATION_MS
      );
      expect(metric.status).toBe("OPTIMAL");
      expect(metric.durationMs).toBe(120);
    });

    it("classifies borderline latency as ACCEPTABLE", () => {
      const metric = evaluateEndpointPerformance(
        "/api/v1/dashboard/patient",
        "Fanout Aggregate",
        420,
        SLA_THRESHOLDS.PATIENT_DASHBOARD_FANOUT_MS
      );
      expect(metric.status).toBe("ACCEPTABLE");
    });

    it("flags latency exceeding SLA as DEGRADED", () => {
      const metric = evaluateEndpointPerformance(
        "/api/v1/patients/lookup",
        "Elastic MRN Search",
        280,
        SLA_THRESHOLDS.SEARCH_LOOKUP_MS
      );
      expect(metric.status).toBe("DEGRADED");
    });
  });

  describe("regression suite audit & risk tracking", () => {
    it("passes when all tested critical endpoints meet SLA thresholds", () => {
      const metrics: PerformanceMetric[] = [
        {
          endpoint: "/api/v1/queue/tokens",
          operation: "Check-in",
          durationMs: 140,
          thresholdMs: 300,
          status: "OPTIMAL",
        },
        {
          endpoint: "/api/v1/emr/encounters/sign",
          operation: "Sign Encounter",
          durationMs: 250,
          thresholdMs: 400,
          status: "OPTIMAL",
        },
      ];

      const audit = executeRegressionAudit(metrics);
      expect(audit.criticalPathVerified).toBe(true);
      expect(audit.edgeCasesPassed).toBe(true);
      expect(audit.performanceAcceptable).toBe(true);
      expect(audit.risksIdentified.length).toBe(0);
    });

    it("documents and exposes performance risks when degraded latency is detected", () => {
      const metrics: PerformanceMetric[] = [
        {
          endpoint: "/api/v1/reports/overview",
          operation: "Complex SQL Rollup",
          durationMs: 950,
          thresholdMs: 500,
          status: "DEGRADED",
        },
      ];

      const audit = executeRegressionAudit(metrics);
      expect(audit.performanceAcceptable).toBe(false);
      expect(audit.risksIdentified.length).toBe(1);
      expect(audit.risksIdentified[0]).toContain("Performance latency risk on /api/v1/reports/overview");
    });
  });
});
