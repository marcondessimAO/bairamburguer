"use client";

import { useRef, useState } from "react";
import { adminService, OrderDTO } from "@/services/admin";

type CancelOrderButtonProps = {
  order: OrderDTO;
  onCanceled: (order: OrderDTO) => void;
};

export const isOrderCancelable = (order: OrderDTO) => {
  const isPayableInPerson = order.paymentMethod === "DINHEIRO" || order.paymentMethod === "CARTAO";
  const isAwaitingPayment = order.paymentStatus === "AWAITING_PAYMENT" || order.paymentStatus === "PENDING";
  const isCancelableStatus = order.orderStatus === "PENDING" || order.orderStatus === "PREPARING";
  return isPayableInPerson && isAwaitingPayment && isCancelableStatus;
};

export const removeCanceledOrder = (orders: OrderDTO[], canceledOrderId: number) =>
  orders.filter((order) => order.id !== canceledOrderId);

export function CancelOrderButton({ order, onCanceled }: CancelOrderButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const inFlightRef = useRef(false);

  if (!isOrderCancelable(order)) return null;

  const close = () => {
    if (inFlightRef.current) return;
    setError("");
    setIsOpen(false);
  };

  const confirmCancellation = async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setIsProcessing(true);
    setError("");
    try {
      const canceledOrder = await adminService.cancelOrder(order.id);
      onCanceled(canceledOrder);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível cancelar o pedido. Tente novamente.");
    } finally {
      inFlightRef.current = false;
      setIsProcessing(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="mt-2 w-full rounded-lg border border-red-400/30 bg-red-500/10 py-2 text-sm font-bold text-red-300 transition hover:border-red-400/50 hover:bg-red-500/20"
      >
        Cancelar pedido
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div role="dialog" aria-modal="true" aria-labelledby={`cancel-order-${order.id}`} className="w-full max-w-md rounded-2xl border border-zinc-700 bg-[#1E1E1E] p-6 shadow-2xl">
            <h2 id={`cancel-order-${order.id}`} className="text-xl font-black text-white">Cancelar pedido #{order.id}?</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-300">
              O pedido será removido do fluxo da cozinha, mas permanecerá registrado no histórico.
            </p>
            {error && <p role="alert" className="mt-4 rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm font-semibold text-red-200">{error}</p>}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button type="button" onClick={close} disabled={isProcessing} className="rounded-lg border border-zinc-600 px-4 py-2.5 font-bold text-zinc-200 hover:bg-zinc-800 disabled:opacity-50">
                Voltar
              </button>
              <button type="button" onClick={() => void confirmCancellation()} disabled={isProcessing} className="rounded-lg bg-red-600 px-4 py-2.5 font-black text-white hover:bg-red-500 disabled:cursor-wait disabled:opacity-60">
                {isProcessing ? "Cancelando..." : "Cancelar pedido"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
