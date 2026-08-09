import { describe, expect, it } from "vitest";
import {
  apiDateTimeMillis,
  dashboardPointLabel,
  dashboardRange,
  formatStoreDateTime,
  formatStoreTime,
  normalizeApiDateTime,
} from "./storeTime";

describe("storeTime", () => {
  it("keeps explicit timestamps and assigns the Recife offset to legacy LocalDateTime values", () => {
    expect(normalizeApiDateTime("2026-08-09T00:30:00-03:00")).toBe("2026-08-09T00:30:00-03:00");
    expect(normalizeApiDateTime("2026-08-09T00:30:00")).toBe("2026-08-09T03:30:00.000Z");
    expect(formatStoreTime("09/08/2026 00:30")).toBe("00:30");
    expect(formatStoreDateTime("2026-08-09T00:30:00Z")).toContain("08/08/2026");
    expect(formatStoreTime("2026-08-09T00:30:00-03:00")).toBe("00:30");
  });

  it("calculates today from America/Recife across the UTC midnight boundary", () => {
    const beforeMidnightInRecife = new Date("2026-08-09T02:30:00Z");
    expect(dashboardRange("today", beforeMidnightInRecife)).toEqual({
      start: "2026-08-08",
      end: "2026-08-08",
    });
    expect(dashboardRange("last7", beforeMidnightInRecife)).toEqual({
      start: "2026-08-02",
      end: "2026-08-08",
    });
  });

  it("labels hourly and daily buckets from declared granularity instead of point count", () => {
    expect(dashboardPointLabel("2026-08-09T10:00:00-03:00", "hour")).toBe("10h");
    expect(dashboardPointLabel("2026-08-09T00:00:00-03:00", "day")).toBe("09/08");
  });

  it("sorts explicit and legacy API timestamps as the same instant", () => {
    expect(apiDateTimeMillis("2026-08-09T12:00:00")).toBe(apiDateTimeMillis("2026-08-09T12:00:00-03:00"));
  });
});
