import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { adminService, OrderDTO } from "@/services/admin";
import { CancelOrderButton, removeCanceledOrder } from "./CancelOrderButton";

vi.mock("@/services/admin", () => ({
  adminService: { cancelOrder: vi.fn() },
}));

const order = (overrides: Partial<OrderDTO> = {}): OrderDTO => ({
  id: 249,
  customerName: "Cliente",
  customerPhone: "83999999999",
  items: [],
  totalAmount: 30,
  orderStatus: "PENDING",
  paymentStatus: "AWAITING_PAYMENT",
  paymentMethod: "DINHEIRO",
  createdAt: "2026-08-07T12:00:00",
  ...overrides,
});

describe("CancelOrderButton", () => {
  beforeEach(() => vi.clearAllMocks());

  it.each(["DINHEIRO", "CARTAO"] as const)("shows cancellation for %s awaiting payment", (paymentMethod) => {
    render(<CancelOrderButton order={order({ paymentMethod })} onCanceled={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Cancelar pedido" })).toBeInTheDocument();
  });

  it("does not show cancellation for Pix, paid, dispatched or delivered orders", () => {
    const { rerender } = render(<CancelOrderButton order={order({ paymentMethod: "PIX" })} onCanceled={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "Cancelar pedido" })).not.toBeInTheDocument();
    rerender(<CancelOrderButton order={order({ paymentStatus: "PAID" })} onCanceled={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "Cancelar pedido" })).not.toBeInTheDocument();
    rerender(<CancelOrderButton order={order({ orderStatus: "DISPATCHED" })} onCanceled={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "Cancelar pedido" })).not.toBeInTheDocument();
    rerender(<CancelOrderButton order={order({ orderStatus: "DELIVERED" })} onCanceled={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "Cancelar pedido" })).not.toBeInTheDocument();
  });

  it("opens confirmation and Back closes it without calling the API", async () => {
    const user = userEvent.setup();
    render(<CancelOrderButton order={order()} onCanceled={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Cancelar pedido" }));
    expect(screen.getByRole("dialog")).toHaveTextContent("Cancelar pedido #249?");
    await user.click(screen.getByRole("button", { name: "Voltar" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(adminService.cancelOrder).not.toHaveBeenCalled();
  });

  it("calls the API once, disables confirmation and reports success", async () => {
    let resolveRequest!: (value: OrderDTO) => void;
    vi.mocked(adminService.cancelOrder).mockReturnValue(new Promise((resolve) => { resolveRequest = resolve; }));
    const onCanceled = vi.fn();
    const user = userEvent.setup();
    render(<CancelOrderButton order={order()} onCanceled={onCanceled} />);
    await user.click(screen.getByRole("button", { name: "Cancelar pedido" }));
    const confirm = screen.getAllByRole("button", { name: "Cancelar pedido" })[1];

    fireEvent.click(confirm);
    fireEvent.click(confirm);

    expect(adminService.cancelOrder).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Cancelando..." })).toBeDisabled();
    const canceled = order({ orderStatus: "CANCELED" });
    resolveRequest(canceled);
    await waitFor(() => expect(onCanceled).toHaveBeenCalledWith(canceled));
  });

  it("shows a friendly API error and keeps the dialog open", async () => {
    vi.mocked(adminService.cancelOrder).mockRejectedValue(new Error("Este pedido já foi finalizado e não pode ser cancelado."));
    const user = userEvent.setup();
    render(<CancelOrderButton order={order()} onCanceled={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Cancelar pedido" }));
    await user.click(screen.getAllByRole("button", { name: "Cancelar pedido" })[1]);

    expect(await screen.findByRole("alert")).toHaveTextContent("já foi finalizado");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("removes only the canceled order from the active Kanban", () => {
    const activeOrders = [order({ id: 248 }), order({ id: 249 }), order({ id: 250 })];

    expect(removeCanceledOrder(activeOrders, 249).map(({ id }) => id)).toEqual([248, 250]);
  });
});
