"use client";

import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { NEIGHBORHOODS, PendingPayment, useCart } from "@/contexts/CartContext";
import { getImageUrl } from "@/utils/imageUrl";

const BRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

type OrderSnapshot = {
  customerName: string;
  customerPhone: string;
  items: {
    name: string;
    quantity: number;
    price: number;
    addonsSummary?: string;
    addonsTotal: number;
  }[];
  street: string;
  number: string;
  complement: string;
  neighborhoodName: string;
  deliveryMode: "DELIVERY" | "TAKEOUT";
  total: number;
};

export function CartDrawer() {
  const router = useRouter();
  const {
    cartItems,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeFromCart,
    deliveryNeighborhood,
    subtotal,
    deliveryFee,
    totalAmount,
    setNeighborhood,
    clearCart,
    pendingPayment,
    setPendingPayment,
    isStoreOpen,
  } = useCart();

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerCpf, setCustomerCpf] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [deliveryMode, setDeliveryMode] = useState<"DELIVERY" | "TAKEOUT">("DELIVERY");

  const orderSnapshotRef = useRef<OrderSnapshot | null>(null);

  const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const checkoutTotal = deliveryMode === "TAKEOUT" ? subtotal : totalAmount;
  const isValidToSubmit =
    cartItems.length > 0 &&
    customerName.trim() !== "" &&
    customerPhone.trim() !== "" &&
    (deliveryMode === "TAKEOUT" ||
      (deliveryNeighborhood !== null && street.trim() !== "" && number.trim() !== ""));

  const openWhatsApp = (orderData: PendingPayment) => {
    const snap = orderSnapshotRef.current;
    const storeWhatsApp = "558399327186";

    let message = "*Novo Pedido - Bairamburguer!*\n";
    message += `*Pedido:* #${orderData.orderId}\n`;

    if (snap) {
      message += `*Nome:* ${snap.customerName}\n`;
      message += `*WhatsApp:* ${snap.customerPhone}\n`;
      message += "\n*Itens:*\n";
      snap.items.forEach((item) => {
        message += `- ${item.quantity}x ${item.name}\n`;
        if (item.addonsSummary) {
          message += `  Complementos: ${item.addonsSummary}\n`;
        }
      });
      message += `\n*Total:* ${BRL(snap.total)}\n`;

      if (snap.deliveryMode === "DELIVERY") {
        const address = [snap.street, snap.number, snap.complement].filter(Boolean).join(", ");
        message += `*Endereco:* ${address} - ${snap.neighborhoodName}\n`;
      } else {
        message += "*Modalidade:* Retirada na loja\n";
      }
    }

    message += "\n_Pedido realizado pelo site. Confirmar forma de pagamento pelo WhatsApp._";
    window.open(`https://wa.me/${storeWhatsApp}?text=${encodeURIComponent(message)}`, "_blank");
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;

    if (deliveryMode === "DELIVERY" && (!deliveryNeighborhood || !street || !number)) {
      alert("Por favor, preencha todos os campos de endereco de entrega.");
      return;
    }

    if (!customerName || !customerPhone) {
      alert("Por favor, preencha seus dados pessoais (Nome e WhatsApp).");
      return;
    }

    setIsProcessing(true);

    try {
      const payload = {
        customerName,
        customerPhone,
        customerEmail,
        customerCpf,
        street: deliveryMode === "DELIVERY" ? street : "",
        number: deliveryMode === "DELIVERY" ? number : "",
        complement: deliveryMode === "DELIVERY" ? complement : "",
        neighborhoodName:
          deliveryMode === "DELIVERY" && deliveryNeighborhood ? deliveryNeighborhood.name : null,
        items: cartItems.map((item) => ({
          product: item.product.id,
          quantity: item.quantity,
          beverageAddon: item.addons?.beverageAddon,
          friesAddon: item.addons?.friesAddon === true,
        })),
      };

      const response = await fetch("/api/orders/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 201) {
        const data: PendingPayment = await response.json();
        orderSnapshotRef.current = {
          customerName,
          customerPhone,
          items: cartItems.map((item) => ({
            name: item.product.name,
            quantity: item.quantity,
            price: item.product.price,
            addonsSummary: item.addonsSummary,
            addonsTotal: item.addonsTotal,
          })),
          street: deliveryMode === "DELIVERY" ? street : "",
          number: deliveryMode === "DELIVERY" ? number : "",
          complement: deliveryMode === "DELIVERY" ? complement : "",
          neighborhoodName:
            deliveryMode === "DELIVERY" && deliveryNeighborhood
              ? deliveryNeighborhood.name
              : "Retirada na Loja",
          deliveryMode,
          total: checkoutTotal,
        };

        setPendingPayment(data);
        clearCart();
        openWhatsApp(data);
      } else {
        const errorText = await response.text();
        alert(`Erro do Servidor (${response.status}):\n\n${errorText}`);
      }
    } catch (error) {
      console.error(error);
      alert("Erro de conexao com o servidor. Verifique se a API esta rodando.");
    } finally {
      setIsProcessing(false);
    }
  };

  const closeDrawer = () => {
    if (pendingPayment) return;
    setIsCartOpen(false);
  };

  const handleCloseAndReturn = () => {
    setPendingPayment(null);
    setIsCartOpen(false);
    router.push("/");
  };

  if (!isCartOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={closeDrawer}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Carrinho de compras"
        className="fixed inset-y-0 right-0 z-50 flex h-[100dvh] w-full flex-col border-l border-[#2B4725] bg-[#07110B] shadow-[-8px_0_40px_rgba(0,0,0,0.8)] md:w-[420px]"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[#2B4725] px-6 py-5">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-black tracking-tight text-[#FFF8E6]">
              {pendingPayment ? "Pedido enviado" : "Resumo do Pedido"}
            </h2>
            {!pendingPayment && totalItems > 0 && (
              <span className="rounded-full bg-[#F6B51B] px-2 py-0.5 text-xs font-black text-[#07110B]">
                {totalItems} {totalItems === 1 ? "item" : "itens"}
              </span>
            )}
          </div>
          <button
            onClick={closeDrawer}
            className="rounded-lg p-1 text-[#7E8D75] transition-colors hover:bg-[#172315] hover:text-[#FFF8E6]"
            aria-label="Fechar carrinho"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {pendingPayment ? (
          <div className="flex flex-1 flex-col items-center justify-center space-y-6 overflow-y-auto p-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#25D366]/30 bg-[#25D366]/20 text-[#25D366]">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <div className="space-y-2 text-center">
              <h3 className="text-2xl font-black text-white">Pedido criado!</h3>
              <p className="text-sm text-gray-400">
                Enviamos o resumo para o WhatsApp da loja. Se a janela nao abriu, toque no botao abaixo.
              </p>
              <p className="text-sm font-bold text-[#F6B51B]">
                Pedido #{pendingPayment.orderId} - {BRL(pendingPayment.totalAmount)}
              </p>
            </div>

            <button
              onClick={() => openWhatsApp(pendingPayment)}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] py-4 font-black text-white shadow-lg shadow-[#25D366]/20 transition-all hover:bg-[#1ebe59] active:scale-[0.98]"
            >
              <svg className="h-5 w-5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.556 4.121 1.528 5.854L0 24l6.316-1.508A11.934 11.934 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.015-1.373l-.36-.214-3.727.979.994-3.636-.234-.374A9.818 9.818 0 1112 21.818z" />
              </svg>
              Abrir WhatsApp
            </button>

            <button
              onClick={handleCloseAndReturn}
              className="w-full bg-transparent py-2 font-medium text-gray-400 transition-colors hover:text-white"
            >
              Fechar e voltar ao cardapio
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
              {cartItems.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-4 py-16 text-gray-500">
                  <svg className="h-14 w-14 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <div className="text-center">
                    <p className="font-semibold text-gray-400">Sua sacola esta vazia</p>
                    <p className="mt-1 text-sm text-gray-600">Adicione um lanche delicioso!</p>
                  </div>
                  <button
                    onClick={() => {
                      setIsCartOpen(false);
                      router.push("/");
                    }}
                    className="mt-6 w-full rounded-xl bg-[#F6B51B] py-3 font-bold text-[#07110B]"
                  >
                    Explorar Cardapio
                  </button>
                </div>
              ) : (
                <>
                  {cartItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-3 rounded-2xl border border-[#2B4725]/70 bg-[#101A12] p-3"
                    >
                      <div className="h-[72px] w-[72px] flex-shrink-0 overflow-hidden rounded-xl border border-[#35532A] bg-[#172315]">
                        {item.product.imageUrl ? (
                          <img
                            src={getImageUrl(item.product.imageUrl)}
                            alt={item.product.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-gray-600">
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>

                      <div className="flex min-w-0 flex-1 flex-col justify-between">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="line-clamp-2 text-sm font-bold leading-tight text-white">
                            {item.product.name}
                          </h3>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="flex-shrink-0 text-gray-600 transition-colors hover:text-red-400"
                            aria-label={`Remover ${item.product.name}`}
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                          <span className="text-sm font-black text-[#F6B51B]">
                            {BRL((item.product.price + item.addonsTotal) * item.quantity)}
                          </span>
                          {item.addonsSummary && (
                            <span className="line-clamp-2 w-full text-[11px] text-gray-400">
                              {item.addonsSummary}
                            </span>
                          )}

                          <div className="flex items-center gap-2 rounded-lg border border-[#35532A] bg-[#172315] p-1">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="flex h-7 w-7 items-center justify-center rounded-md bg-[#2e2e2e] font-bold text-gray-300 transition-colors hover:bg-gray-700 hover:text-white"
                              aria-label="Diminuir quantidade"
                            >
                              -
                            </button>
                            <span className="w-5 text-center text-sm font-black tabular-nums text-white">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="flex h-7 w-7 items-center justify-center rounded-md bg-[#F6B51B] font-bold text-[#07110B] transition-colors hover:bg-[#FFD33D]"
                              aria-label="Aumentar quantidade"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="mt-2 w-full rounded-xl border border-dashed border-[#F6B51B]/30 py-3 text-center font-medium text-[#F6B51B] transition-colors hover:bg-[#F6B51B]/10"
                  >
                    + Adicionar mais itens
                  </button>
                </>
              )}

              <div className="flex gap-4 pt-2">
                <label className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border py-3 transition-colors ${deliveryMode === "DELIVERY" ? "border-[#F6B51B] bg-[#F6B51B]/10 text-[#F6B51B]" : "border-[#2B4725] bg-[#101A12] text-[#7E8D75]"}`}>
                  <input type="radio" name="deliveryMode" value="DELIVERY" checked={deliveryMode === "DELIVERY"} onChange={() => setDeliveryMode("DELIVERY")} className="hidden" />
                  <span className="text-sm font-bold">Entregar em Casa</span>
                </label>
                <label className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border py-3 transition-colors ${deliveryMode === "TAKEOUT" ? "border-[#F6B51B] bg-[#F6B51B]/10 text-[#F6B51B]" : "border-[#2B4725] bg-[#101A12] text-[#7E8D75]"}`}>
                  <input type="radio" name="deliveryMode" value="TAKEOUT" checked={deliveryMode === "TAKEOUT"} onChange={() => setDeliveryMode("TAKEOUT")} className="hidden" />
                  <span className="text-sm font-bold">Retirar na Loja</span>
                </label>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Seu Nome"
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  className="w-full rounded-xl border border-[#2B4725] bg-[#101A12] px-4 py-3 text-sm text-[#FFF8E6] placeholder:text-[#7E8D75] transition-shadow focus:outline-none focus:ring-2 focus:ring-[#F6B51B]"
                />
                <input
                  type="text"
                  placeholder="Seu WhatsApp (ex: 83 99999-9999)"
                  value={customerPhone}
                  onChange={(event) => setCustomerPhone(event.target.value)}
                  className="w-full rounded-xl border border-[#2B4725] bg-[#101A12] px-4 py-3 text-sm text-[#FFF8E6] placeholder:text-[#7E8D75] transition-shadow focus:outline-none focus:ring-2 focus:ring-[#F6B51B]"
                />
                <input
                  type="email"
                  placeholder="Seu E-mail (opcional)"
                  value={customerEmail}
                  onChange={(event) => setCustomerEmail(event.target.value)}
                  className="w-full rounded-xl border border-[#2B4725] bg-[#101A12] px-4 py-3 text-sm text-[#FFF8E6] placeholder:text-[#7E8D75] transition-shadow focus:outline-none focus:ring-2 focus:ring-[#F6B51B]"
                />
                <input
                  type="text"
                  placeholder="Seu CPF (opcional)"
                  value={customerCpf}
                  onChange={(event) => setCustomerCpf(event.target.value.replace(/\D/g, "").substring(0, 11))}
                  className="w-full rounded-xl border border-[#2B4725] bg-[#101A12] px-4 py-3 text-sm text-[#FFF8E6] placeholder:text-[#7E8D75] transition-shadow focus:outline-none focus:ring-2 focus:ring-[#F6B51B]"
                />

                {deliveryMode === "DELIVERY" && (
                  <>
                    <input
                      type="text"
                      placeholder="Sua Rua"
                      value={street}
                      onChange={(event) => setStreet(event.target.value)}
                      className="w-full rounded-xl border border-[#2B4725] bg-[#101A12] px-4 py-3 text-sm text-[#FFF8E6] placeholder:text-[#7E8D75] transition-shadow focus:outline-none focus:ring-2 focus:ring-[#F6B51B]"
                    />
                    <div className="flex gap-3">
                      <input
                        type="text"
                        placeholder="Numero"
                        value={number}
                        onChange={(event) => setNumber(event.target.value)}
                        className="w-1/3 rounded-xl border border-[#2B4725] bg-[#101A12] px-4 py-3 text-sm text-[#FFF8E6] placeholder:text-[#7E8D75] transition-shadow focus:outline-none focus:ring-2 focus:ring-[#F6B51B]"
                      />
                      <input
                        type="text"
                        placeholder="Complemento (Opcional)"
                        value={complement}
                        onChange={(event) => setComplement(event.target.value)}
                        className="w-2/3 rounded-xl border border-[#2B4725] bg-[#101A12] px-4 py-3 text-sm text-[#FFF8E6] placeholder:text-[#7E8D75] transition-shadow focus:outline-none focus:ring-2 focus:ring-[#F6B51B]"
                      />
                    </div>
                  </>
                )}
              </div>

              {deliveryMode === "DELIVERY" && (
                <select
                  id="neighborhood-select"
                  value={deliveryNeighborhood?.name ?? ""}
                  onChange={(event) => setNeighborhood(event.target.value)}
                  className="w-full cursor-pointer appearance-none rounded-xl border border-[#2B4725] bg-[#101A12] px-4 py-3 text-sm text-[#FFF8E6] transition-shadow focus:outline-none focus:ring-2 focus:ring-[#F6B51B]"
                >
                  <option value="" disabled className="bg-[#101A12] text-[#7E8D75]">
                    Selecione seu bairro...
                  </option>
                  {NEIGHBORHOODS.map((neighborhood) => (
                    <option key={neighborhood.name} value={neighborhood.name} className="bg-[#101A12] text-[#FFF8E6]">
                      {neighborhood.name} - {BRL(neighborhood.fee)}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="shrink-0 space-y-4 border-t border-[#2B4725] bg-[#101A12] px-6 py-5">
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between text-gray-400">
                  <span className="font-medium">Subtotal</span>
                  <span className="font-semibold text-white">{BRL(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span className="font-medium">Taxa de entrega</span>
                  <span className={deliveryMode === "TAKEOUT" || deliveryNeighborhood ? "font-semibold text-white" : "text-gray-500 italic"}>
                    {deliveryMode === "TAKEOUT"
                      ? "Gratis (Retirada)"
                      : deliveryNeighborhood
                        ? BRL(deliveryFee)
                        : "Selecione um bairro"}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-gray-700 pt-3">
                  <span className="font-bold text-white">Total</span>
                  <span className="text-2xl font-black tabular-nums text-[#F6B51B]">{BRL(checkoutTotal)}</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={!isStoreOpen || !isValidToSubmit || isProcessing}
                className={`flex w-full items-center justify-center gap-2.5 rounded-xl py-4 font-black shadow-lg transition-all disabled:cursor-not-allowed disabled:opacity-40 ${!isStoreOpen ? "bg-red-600 text-white shadow-red-600/10" : "bg-[#F6B51B] text-[#07110B] shadow-[#F6B51B]/10 hover:bg-[#FFD33D] active:scale-[0.98]"}`}
              >
                {!isStoreOpen
                  ? "Loja Fechada no momento"
                  : isProcessing
                    ? "Processando..."
                    : "Finalizar pedido no WhatsApp"}
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
