import { describe, it, expect } from "vitest";
import { apiSuccess, apiError, apiPaginated } from "@/lib/api-envelope";

describe("API Envelope Conformance (Section A.4.2)", () => {
  it("wraps successful single object responses correctly", () => {
    const data = { id: "apt-01", status: "CONFIRMED" };
    const response = apiSuccess(data);
    const json = JSON.parse(JSON.stringify(response));

    // Next.js NextResponse mock inspect
    expect(response.status).toBe(200);
  });

  it("formats error envelopes with code, message, and timestamp", async () => {
    const errRes = apiError("CONCURRENCY_CONFLICT", "Slot is already booked", 409, {
      slot: "10:30",
    });
    expect(errRes.status).toBe(409);

    const body = await errRes.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("CONCURRENCY_CONFLICT");
    expect(body.error.message).toBe("Slot is already booked");
    expect(body.error.details.slot).toBe("10:30");
    expect(body.error.timestamp).toBeDefined();
  });

  it("formats paginated list envelopes with pagination metadata", async () => {
    const items = [{ id: 1 }, { id: 2 }];
    const paginatedRes = apiPaginated(items, 1, 10, 2);
    expect(paginatedRes.status).toBe(200);

    const body = await paginatedRes.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(2);
    expect(body.meta.page).toBe(1);
    expect(body.meta.pageSize).toBe(10);
    expect(body.meta.totalItems).toBe(2);
    expect(body.meta.totalPages).toBe(1);
  });
});
