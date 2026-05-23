"use client";

import React from "react";
import { useCart, NEIGHBORHOODS } from "@/contexts/CartContext";

const BRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export function CartDrawer() {
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
  } = useCart();

  // ─── RF07: Montar mensagem e redirecionar ao WhatsApp ─────────────────────
  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    if (!deliveryNeighborhood) {
      alert("Por favor, selecione o bairro de entrega antes de finalizar o pedido.");
      return;
    }

    const itensTxt = cartItems
      .map((item) => `${item.quantity}x ${item.product.name}`)
      .join(", ");

    const mensagem =
      `Olá! Gostaria de pedir: ${itensTxt}. ` +
      `Entrega em: ${deliveryNeighborhood.name}. ` +
      `Subtotal: ${BRL(subtotal)} | Taxa de entrega: ${BRL(deliveryFee)} | ` +
      `Total: ${BRL(totalAmount)}`;

    const phone = "5583999999999";
    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(mensagem)}`,
      "_blank"
    );
  };

  if (!isCartOpen) return null;

  const totalItems = cartItems.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <>
      {/* ── Overlay ── */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      {/* ── Drawer Panel ── */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Carrinho de compras"
        className="fixed inset-y-0 right-0 z-50 flex flex-col w-full md:w-[420px] bg-[#121212] shadow-[−8px_0_40px_rgba(0,0,0,0.8)] border-l border-gray-800"
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-black text-[#FFFFFF] tracking-tight">
              Resumo do Pedido
            </h2>
            {totalItems > 0 && (
              <span className="bg-[#F1C40F] text-[#121212] text-xs font-black px-2 py-0.5 rounded-full">
                {totalItems} {totalItems === 1 ? "item" : "itens"}
              </span>
            )}
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-800"
            aria-label="Fechar carrinho"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Lista de Itens ── */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-500 py-16">
              <svg className="w-14 h-14 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <div className="text-center">
                <p className="font-semibold text-gray-400">Sua sacola está vazia</p>
                <p className="text-sm text-gray-600 mt-1">Adicione um lanche delicioso!</p>
              </div>
            </div>
          ) : (
            cartItems.map((item) => (
              <div
                key={item.product.id}
                className="flex gap-3 bg-[#1a1a1a] rounded-2xl p-3 border border-gray-800/60"
              >
                {/* Miniatura */}
                <div className="w-[72px] h-[72px] bg-[#2A2A2A] rounded-xl overflow-hidden flex-shrink-0 border border-gray-700">
                  {item.product.imageUrl ? (
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Detalhes */}
                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-bold text-[#FFFFFF] leading-tight line-clamp-2">
                      {item.product.name}
                    </h3>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-gray-600 hover:text-red-400 transition-colors flex-shrink-0"
                      aria-label={`Remover ${item.product.name}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[#F1C40F] font-black text-sm">
                      {BRL(item.product.price * item.quantity)}
                    </span>

                    {/* Controles de Quantidade */}
                    <div className="flex items-center gap-2 bg-[#242424] rounded-lg p-1 border border-gray-700">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="w-7 h-7 flex items-center justify-center text-gray-300 hover:text-white bg-[#2e2e2e] hover:bg-gray-700 rounded-md transition-colors font-bold"
                        aria-label="Diminuir quantidade"
                      >
                        −
                      </button>
                      <span className="text-[#FFFFFF] text-sm font-black w-5 text-center tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="w-7 h-7 flex items-center justify-center text-[#121212] bg-[#F1C40F] hover:bg-[#D4AC0D] rounded-md transition-colors font-bold"
                        aria-label="Aumentar quantidade"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ── Footer: Bairro + Resumo + Botão ── */}
        <div className="px-6 py-5 bg-[#181818] border-t border-gray-800 space-y-5">

          {/* RF08 – Seletor de Bairro */}
          <div className="space-y-2">
            <label htmlFor="neighborhood-select" className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Bairro de Entrega
            </label>
            <select
              id="neighborhood-select"
              value={deliveryNeighborhood?.name ?? ""}
              onChange={(e) => setNeighborhood(e.target.value)}
              className="w-full bg-[#1e1e1e] text-[#FFFFFF] border border-gray-700 rounded-xl px-4 py-3 text-sm font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-[#F1C40F]/40 focus:border-[#F1C40F] transition-colors cursor-pointer"
              style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center", backgroundSize: "18px", paddingRight: "42px" }}
            >
              <option value="" disabled className="bg-[#1e1e1e] text-gray-500">
                Selecione seu bairro...
              </option>
              {NEIGHBORHOODS.map((n) => (
                <option key={n.name} value={n.name} className="bg-[#1e1e1e] text-white">
                  {n.name} — {BRL(n.fee)}
                </option>
              ))}
            </select>
          </div>

          {/* Resumo de Valores */}
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between text-gray-400">
              <span className="font-medium">Subtotal</span>
              <span className="text-[#FFFFFF] font-semibold">{BRL(subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span className="font-medium">Taxa de entrega</span>
              <span className={deliveryNeighborhood ? "text-[#FFFFFF] font-semibold" : "text-gray-500 italic"}>
                {deliveryNeighborhood ? BRL(deliveryFee) : "Selecione um bairro"}
              </span>
            </div>
            <div className="flex justify-between pt-3 border-t border-gray-700 items-center">
              <span className="text-[#FFFFFF] font-bold">Total</span>
              <span className="text-2xl font-black text-[#F1C40F] tabular-nums">{BRL(totalAmount)}</span>
            </div>
          </div>

          {/* RF07 – Botão Finalizar via WhatsApp */}
          <button
            onClick={handleCheckout}
            disabled={cartItems.length === 0}
            className="w-full flex items-center justify-center gap-2.5 bg-[#F1C40F] hover:bg-[#D4AC0D] active:scale-[0.98] text-[#121212] font-black py-4 rounded-xl shadow-lg shadow-[#F1C40F]/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {/* Ícone WhatsApp */}
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Finalizar Pedido via WhatsApp
          </button>
        </div>
      </aside>
    </>
  );
}
