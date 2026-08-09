import { describe, expect, it } from "vitest";
import type { OrderDTO } from "@/services/admin";
import { buildPrintableOrderHtml } from "./PrintOrderButton";

const order = (createdAt: string): OrderDTO => ({
  id: 90,
  customerName: "Cliente",
  customerPhone: "83999999999",
  items: [],
  totalAmount: 20,
  orderStatus: "PENDING",
  paymentStatus: "AWAITING_PAYMENT",
  paymentMethod: "DINHEIRO",
  createdAt,
});

describe("PrintOrderButton time contract", () => {
  it("prints the store time from an explicit API offset", () => {
    expect(buildPrintableOrderHtml(order("2026-08-09T00:30:00-03:00"))).toContain("09/08/2026, 00:30");
  });

  it("keeps legacy timestamps at the same Recife wall time", () => {
    expect(buildPrintableOrderHtml(order("2026-08-09T00:30:00"))).toContain("09/08/2026, 00:30");
  });
});
