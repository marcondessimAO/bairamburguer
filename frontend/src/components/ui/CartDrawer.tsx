"use client";

import React, { useState } from "react";
import { useCart, NEIGHBORHOODS } from "@/contexts/CartContext";
import { getImageUrl } from "@/utils/imageUrl";

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

  // ─── Integração da API do Backend ─────────────────────────────────────────
  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    if (deliveryMode === "DELIVERY" && (!deliveryNeighborhood || !street || !number)) {
      alert("Por favor, preencha todos os campos de endereço de entrega.");
      return;
    }
    if (!customerName || !customerPhone || !customerEmail || !customerCpf) {
      alert("Por favor, preencha seus dados pessoais (Nome, E-mail, CPF, WhatsApp).");
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
        neighborhoodName: deliveryMode === "DELIVERY" && deliveryNeighborhood ? deliveryNeighborhood.name : null,
        items: cartItems.map((item) => ({
          product: item.product.id,
          quantity: item.quantity
        }))
      };

      const baseUrl = "/api";
      const response = await fetch(`${baseUrl}/orders/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (response.status === 201) {
        const data = await response.json();
        setPendingPayment(data);
        clearCart();
      } else {
        const errorText = await response.text();
        alert(`Erro do Servidor (${response.status}):\n\n${errorText}`);
      }
    } catch (error) {
      console.error(error);
      alert("Erro de conexão com o servidor. Verifique se a API está rodando.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyPix = () => {
    if (pendingPayment?.pixCopiaECola) {
      navigator.clipboard.writeText(pendingPayment.pixCopiaECola);
      alert("Código Pix Copiado com sucesso!");
    }
  };

  const closeDrawer = () => {
    if (pendingPayment) return;
    setIsCartOpen(false);
  };

  const handleCloseAndReturn = () => {
    setPendingPayment(null);
    setIsCartOpen(false);
  };

  const handleWhatsApp = () => {
    if (!pendingPayment) return;
    const mensagem = `Olá, Bairamburguer! O meu pedido é o #${pendingPayment.orderId}. Gostaria de acompanhar o status da minha entrega.`;
    window.open('https://api.whatsapp.com/send?phone=558399327186&text=' + encodeURIComponent(mensagem));
    setPendingPayment(null);
    setIsCartOpen(false);
  };

  if (!isCartOpen) return null;

  const totalItems = cartItems.reduce((acc, i) => acc + i.quantity, 0);
  const isValidToSubmit = cartItems.length > 0 && customerName.trim() !== "" && customerPhone.trim() !== "" && customerEmail.trim() !== "" && customerCpf.trim() !== "" && (deliveryMode === "TAKEOUT" || (deliveryNeighborhood !== null && street.trim() !== "" && number.trim() !== ""));

  return (
    <>
      {/* ── Overlay ── */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 transition-opacity"
        onClick={closeDrawer}
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
              {pendingPayment ? "Pedido Concluído" : "Resumo do Pedido"}
            </h2>
            {!pendingPayment && totalItems > 0 && (
              <span className="bg-[#F1C40F] text-[#121212] text-xs font-black px-2 py-0.5 rounded-full">
                {totalItems} {totalItems === 1 ? "item" : "itens"}
              </span>
            )}
          </div>
          <button
            onClick={closeDrawer}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-800"
            aria-label="Fechar carrinho"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Conditional Render: Tela de Pagamento ou Carrinho ── */}
        {pendingPayment ? (
          <div className="flex flex-col items-center justify-center p-8 space-y-6 flex-1 overflow-y-auto">
            <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-black text-white">Aguardando Pagamento</h3>
              <p className="text-gray-400 text-sm">Escaneie o QR Code abaixo com o aplicativo do seu banco para finalizar a compra no valor de <strong>{BRL(pendingPayment.totalAmount)}</strong>.</p>
            </div>
            <div className="flex flex-col items-center mb-6 w-full">
              <div className="bg-white p-4 rounded-xl mb-4">
                {pendingPayment.pixQrCodeBase64 ? (
                  <img 
                    src={`data:image/jpeg;base64,${pendingPayment.pixQrCodeBase64}`} 
                    alt="QR Code Pix" 
                    className="w-48 h-48 object-contain"
                  />
                ) : (
                  <div className="w-48 h-48 bg-gray-200 flex items-center justify-center text-gray-500 text-center text-sm p-4">
                    QR Code Indisponível (Sandbox/Teste)
                  </div>
                )}
              </div>
              <input
                type="text"
                readOnly
                value={pendingPayment.pixCopiaECola || ""}
                className="w-full bg-[#1e1e1e] text-center text-gray-400 text-xs border border-[#2a2a2a] rounded-lg px-3 py-2 outline-none"
              />
            </div>

            <button
              onClick={handleCopyPix}
              className="w-full mt-4 flex items-center justify-center gap-2.5 bg-[#F1C40F] hover:bg-[#D4AC0D] active:scale-[0.98] text-[#121212] font-black py-4 rounded-xl shadow-lg shadow-[#F1C40F]/10 transition-all"
            >
              Copiar Código Pix (Copia e Cola)
            </button>
            <button
              onClick={handleWhatsApp}
              className="bg-[#25D366] text-[#121212] font-bold py-3 w-full rounded-xl hover:bg-[#20bd5a] transition-colors mt-3"
            >
              Acompanhar Pedido no WhatsApp
            </button>
            <button
              onClick={handleCloseAndReturn}
              className="w-full mt-2 text-gray-400 hover:text-white bg-transparent py-2 font-medium transition-colors"
            >
              Fechar e Voltar ao Cardápio
            </button>
          </div>
        ) : (
          <>
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
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="bg-[#F1C40F] text-[#121212] font-bold rounded-xl w-full py-3 mt-6"
                  >
                    Explorar Cardápio
                  </button>
                </div>
              ) : (
                <>
                  {cartItems.map((item) => (
                    <div
                    key={item.product.id}
                    className="flex gap-3 bg-[#1a1a1a] rounded-2xl p-3 border border-gray-800/60"
                  >
                    {/* Miniatura */}
                    <div className="w-[72px] h-[72px] bg-[#2A2A2A] rounded-xl overflow-hidden flex-shrink-0 border border-gray-700">
                      {item.product.imageUrl ? (
                        <img
                          src={getImageUrl(item.product.imageUrl)}
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
                  ))}
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="text-[#F1C40F] font-medium py-3 w-full text-center hover:bg-[#F1C40F]/10 rounded-xl transition-colors border border-dashed border-[#F1C40F]/30 mt-2"
                  >
                    + Adicionar mais itens
                  </button>
                </>
              )}
            </div>

            {/* ── Footer: Dados do Visitante, Bairro + Resumo + Botão ── */}
            <div className="px-6 py-5 bg-[#181818] border-t border-gray-800 space-y-4">
              
              {/* Opção de Entrega */}
              <div className="flex gap-4 mb-4">
                <label className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl cursor-pointer border transition-colors ${deliveryMode === "DELIVERY" ? "bg-[#F1C40F]/10 border-[#F1C40F] text-[#F1C40F]" : "bg-[#1e1e1e] border-gray-800 text-gray-400"}`}>
                  <input type="radio" name="deliveryMode" value="DELIVERY" checked={deliveryMode === "DELIVERY"} onChange={() => setDeliveryMode("DELIVERY")} className="hidden" />
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  <span className="font-bold text-sm">Entregar em Casa</span>
                </label>
                <label className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl cursor-pointer border transition-colors ${deliveryMode === "TAKEOUT" ? "bg-[#F1C40F]/10 border-[#F1C40F] text-[#F1C40F]" : "bg-[#1e1e1e] border-gray-800 text-gray-400"}`}>
                  <input type="radio" name="deliveryMode" value="TAKEOUT" checked={deliveryMode === "TAKEOUT"} onChange={() => setDeliveryMode("TAKEOUT")} className="hidden" />
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                  <span className="font-bold text-sm">Retirar na Loja</span>
                </label>
              </div>

              {/* Inputs do Visitante */}
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Seu Nome"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-[#1e1e1e] text-[#FFFFFF] border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F1C40F] transition-shadow placeholder:text-gray-500"
                />
                <input
                  type="email"
                  placeholder="Seu E-mail (obrigatório)"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full bg-[#1e1e1e] text-[#FFFFFF] border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F1C40F] transition-shadow placeholder:text-gray-500"
                />
                <input
                  type="text"
                  placeholder="Seu CPF (só números)"
                  value={customerCpf}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').substring(0, 11);
                    setCustomerCpf(val);
                  }}
                  className="w-full bg-[#1e1e1e] text-[#FFFFFF] border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F1C40F] transition-shadow placeholder:text-gray-500"
                />
                <input
                  type="text"
                  placeholder="Seu WhatsApp (ex: 83 99999-9999)"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full bg-[#1e1e1e] text-[#FFFFFF] border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F1C40F] transition-shadow placeholder:text-gray-500"
                />
                {deliveryMode === "DELIVERY" && (
                  <>
                    <input
                      type="text"
                      placeholder="Sua Rua"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      className="w-full bg-[#1e1e1e] text-[#FFFFFF] border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F1C40F] transition-shadow placeholder:text-gray-500"
                    />
                    <div className="flex gap-3">
                      <input
                        type="text"
                        placeholder="Número"
                        value={number}
                        onChange={(e) => setNumber(e.target.value)}
                        className="w-1/3 bg-[#1e1e1e] text-[#FFFFFF] border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F1C40F] transition-shadow placeholder:text-gray-500"
                      />
                      <input
                        type="text"
                        placeholder="Complemento (Opcional)"
                        value={complement}
                        onChange={(e) => setComplement(e.target.value)}
                        className="w-2/3 bg-[#1e1e1e] text-[#FFFFFF] border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F1C40F] transition-shadow placeholder:text-gray-500"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Seletor de Bairro */}
              {deliveryMode === "DELIVERY" && (
                <div className="space-y-2">
                  <select
                    id="neighborhood-select"
                    value={deliveryNeighborhood?.name ?? ""}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    className="w-full bg-[#1e1e1e] text-[#FFFFFF] border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[#F1C40F] transition-shadow cursor-pointer"
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
              )}

              {/* Resumo de Valores */}
              <div className="space-y-2.5 text-sm pt-2">
                <div className="flex justify-between text-gray-400">
                  <span className="font-medium">Subtotal</span>
                  <span className="text-[#FFFFFF] font-semibold">{BRL(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span className="font-medium">Taxa de entrega</span>
                  <span className={deliveryMode === "TAKEOUT" || deliveryNeighborhood ? "text-[#FFFFFF] font-semibold" : "text-gray-500 italic"}>
                    {deliveryMode === "TAKEOUT" ? "Grátis (Retirada)" : (deliveryNeighborhood ? BRL(deliveryFee) : "Selecione um bairro")}
                  </span>
                </div>
                <div className="flex justify-between pt-3 border-t border-gray-700 items-center">
                  <span className="text-[#FFFFFF] font-bold">Total</span>
                  <span className="text-2xl font-black text-[#F1C40F] tabular-nums">{BRL(deliveryMode === "TAKEOUT" ? subtotal : totalAmount)}</span>
                </div>
              </div>

              {/* Botão Finalizar via API */}
              <button
                onClick={handleCheckout}
                disabled={!isStoreOpen || !isValidToSubmit || isProcessing}
                className={`w-full flex items-center justify-center gap-2.5 font-black py-4 rounded-xl shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed ${!isStoreOpen ? "bg-red-600 text-white shadow-red-600/10" : "bg-[#F1C40F] hover:bg-[#D4AC0D] active:scale-[0.98] text-[#121212] shadow-[#F1C40F]/10"}`}
              >
                {!isStoreOpen ? "Loja Fechada no momento" : (isProcessing ? "Processando..." : "Finalizar Pedido via Pix")}
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
