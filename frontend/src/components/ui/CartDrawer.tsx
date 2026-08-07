"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart, NEIGHBORHOODS } from "@/contexts/CartContext";
import { getImageUrl } from "@/utils/imageUrl";
import { STORE_WHATSAPP_NUMBER } from "@/config/store";

type CheckoutPaymentMethod = "PIX" | "DINHEIRO" | "CARTAO";

const CARD_SURCHARGE = 2;

type OrderSnapshot = {
  customerName: string;
  customerPhone: string;
  items: { name: string; quantity: number; price: number; addonsSummary?: string; addonsTotal: number }[];
  street: string;
  number: string;
  complement: string;
  neighborhoodName: string;
  deliveryMode: "DELIVERY" | "TAKEOUT";
  total: number;
  paymentMethod: CheckoutPaymentMethod;
  paymentSurcharge: number;
};

const BRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const paymentMethodLabel = (method: CheckoutPaymentMethod) => ({
  PIX: "Pix",
  DINHEIRO: "Dinheiro",
  CARTAO: "Cartão",
}[method]);

const buildWhatsAppUrl = (orderId: number, snapshot: OrderSnapshot | null) => {
  const method = snapshot?.paymentMethod ?? "PIX";
  let message = `Olá! Finalizei o pedido #${orderId} pelo site.\n\n`;
  message += `Forma de pagamento: ${paymentMethodLabel(method)}\n`;
  if (snapshot) {
    message += `Total: ${BRL(snapshot.total)}\n`;
    if (snapshot.paymentSurcharge > 0) {
      message += `Acréscimo do cartão: ${BRL(snapshot.paymentSurcharge)}\n`;
    }
    message += `\nResumo dos itens:\n`;
    snapshot.items.forEach((item) => {
      message += `- ${item.quantity}x ${item.name}\n`;
      if (item.addonsSummary) message += `  Complementos: ${item.addonsSummary}\n`;
    });
    if (snapshot.deliveryMode === "DELIVERY") {
      const address = [snapshot.street, snapshot.number, snapshot.complement].filter(Boolean).join(", ");
      message += `\nEndereço: ${address} — ${snapshot.neighborhoodName}\n`;
    } else {
      message += `\nModalidade: Retirada na loja\n`;
    }
  }
  message += method === "PIX"
    ? `\nPix gerado. Aguardando confirmação de pagamento.`
    : `\nVou finalizar o pagamento/atendimento por aqui.`;
  return `https://wa.me/${STORE_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
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
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<CheckoutPaymentMethod>("PIX");
  const checkoutInFlightRef = useRef(false);

  // Snapshot dos dados do pedido (preservado após clearCart para o WhatsApp)
  const orderSnapshotRef = useRef<OrderSnapshot | null>(null);

  // ─── Integração da API do Backend ─────────────────────────────────────────
  const handleCheckout = async () => {
    if (cartItems.length === 0 || checkoutInFlightRef.current) return;
    if (deliveryMode === "DELIVERY" && (!deliveryNeighborhood || !street || !number)) {
      alert("Por favor, preencha todos os campos de endereço de entrega.");
      return;
    }
    if (!customerName || !customerPhone || !customerEmail || !customerCpf) {
      alert("Por favor, preencha seus dados pessoais (Nome, E-mail, CPF, WhatsApp).");
      return;
    }

    checkoutInFlightRef.current = true;
    setIsProcessing(true);

    try {
      const payload = {
        customerName,
        customerPhone,
        customerEmail,
        customerCpf,
        paymentMethod,
        street: deliveryMode === "DELIVERY" ? street : "",
        number: deliveryMode === "DELIVERY" ? number : "",
        complement: deliveryMode === "DELIVERY" ? complement : "",
        neighborhoodName: deliveryMode === "DELIVERY" && deliveryNeighborhood ? deliveryNeighborhood.name : null,
        items: cartItems.map((item) => ({
          product: item.product.id,
          quantity: item.quantity,
          beverageAddon: item.addons?.beverageAddon,
          friesAddon: item.addons?.friesAddon === true,
          addonIds: item.addons?.addonIds || []
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
        
        // Save order ID to localStorage and phone to sessionStorage safely
        if (data && data.orderId) {
          localStorage.setItem("lastOrderId", data.orderId.toString());
        }
        if (customerPhone) {
          sessionStorage.setItem("lastOrderPhone", customerPhone);
        }

        // Guardar snapshot antes de limpar o carrinho
        orderSnapshotRef.current = {
          customerName,
          customerPhone,
          items: cartItems.map(i => ({ name: i.product.name, quantity: i.quantity, price: i.product.price, addonsSummary: i.addonsSummary, addonsTotal: i.addonsTotal })),
          street: deliveryMode === "DELIVERY" ? street : "",
          number: deliveryMode === "DELIVERY" ? number : "",
          complement: deliveryMode === "DELIVERY" ? complement : "",
          neighborhoodName: deliveryMode === "DELIVERY" && deliveryNeighborhood ? deliveryNeighborhood.name : "Retirada na Loja",
          deliveryMode,
          total: Number(data.totalAmount),
          paymentMethod: data.paymentMethod,
          paymentSurcharge: Number(data.paymentSurcharge ?? 0),
        };

        clearCart();
        if (data.paymentMethod === "PIX") {
          setPendingPayment(data);
        } else {
          setIsCartOpen(false);
          window.location.assign(buildWhatsAppUrl(data.orderId, orderSnapshotRef.current));
        }
      } else {
        const errorText = await response.text();
        console.error("Erro na API de checkout (Status", response.status, "):", errorText);
        alert("Não foi possível finalizar o pedido. Tente novamente ou fale com a loja pelo WhatsApp.");
        return;
      }
    } catch (error) {
      console.error("Erro geral no checkout:", error);
      alert("Não foi possível finalizar o pedido. Tente novamente ou fale com a loja pelo WhatsApp.");
    } finally {
      checkoutInFlightRef.current = false;
      setIsProcessing(false);
    }
  };

  const handleCopyPix = () => {
    if (pendingPayment?.pixCopiaECola) {
      navigator.clipboard.writeText(pendingPayment.pixCopiaECola);
      alert("Código Pix copiado com sucesso!");
    }
  };

  useEffect(() => {
    if (!pendingPayment || !pendingPayment.orderId) return;

    const intervalId = setInterval(async () => {
      try {
        const baseUrl = "/api";
        const response = await fetch(`${baseUrl}/orders/${pendingPayment.orderId}`);
        if (response.ok) {
          const currentOrder = await response.json();
          if (currentOrder && currentOrder.paymentStatus === 'PAID') {
            clearInterval(intervalId);
            const orderId = pendingPayment.orderId;
            setPaymentSuccess(false);
            setPendingPayment(null);
            setIsCartOpen(false);
            router.push(`/pedido-finalizado/${orderId}`);
          }
        }
      } catch (err) {
        console.error("Erro ao verificar status do pagamento:", err);
      }
    }, 3000);

    return () => clearInterval(intervalId);
  }, [pendingPayment, router, setIsCartOpen, setPendingPayment]);

  const closeDrawer = () => {
    if (pendingPayment) return;
    setIsCartOpen(false);
  };

  const handleCloseAndReturn = () => {
    setPendingPayment(null);
    setIsCartOpen(false);
    router.push("/");
  };

  const handleWhatsApp = () => {
    if (!pendingPayment) return;
    window.open(buildWhatsAppUrl(pendingPayment.orderId, orderSnapshotRef.current), "_blank");
  };

  if (!isCartOpen) return null;

  const totalItems = cartItems.reduce((acc, i) => acc + i.quantity, 0);
  const paymentSurcharge = paymentMethod === "CARTAO" ? CARD_SURCHARGE : 0;
  const orderTotal = (deliveryMode === "TAKEOUT" ? subtotal : totalAmount) + paymentSurcharge;
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
        className="fixed inset-y-0 right-0 z-50 flex flex-col w-full md:w-[420px] h-[100dvh] bg-[#F7F8FA] text-zinc-900 shadow-[-8px_0_40px_rgba(0,0,0,0.1)] border-l border-zinc-200"
      >
        {/* ── Header (shrink-0 — nunca encolhe) ── */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-200 shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-black text-zinc-900 tracking-tight">
              {pendingPayment ? "Pedido Concluído" : "Resumo do Pedido"}
            </h2>
            {!pendingPayment && totalItems > 0 && (
              <span className="bg-[#F6B51B] text-[#07110B] text-xs font-black px-2 py-0.5 rounded-full">
                {totalItems} {totalItems === 1 ? "item" : "itens"}
              </span>
            )}
          </div>
          <button
            onClick={closeDrawer}
            className="text-zinc-400 hover:text-zinc-800 transition-colors p-1 rounded-lg hover:bg-zinc-100"
            aria-label="Fechar carrinho"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Conditional Render: Tela de Pagamento ou Carrinho ── */}
        {paymentSuccess ? (
          <div className="flex flex-col items-center justify-center p-8 space-y-6 flex-1 overflow-y-auto">
            <div className="w-24 h-24 bg-[#25D366]/20 text-[#25D366] rounded-full flex items-center justify-center mb-4 border-4 border-[#25D366]/30 animate-pulse">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <div className="text-center space-y-2 mb-8">
              <h3 className="text-3xl font-black text-zinc-900">Pagamento Confirmado!</h3>
              <p className="text-zinc-600 text-base">Seu pedido foi recebido e a nossa cozinha já vai começar o preparo com muito carinho.</p>
            </div>

            <button
              onClick={() => {
                handleWhatsApp();
                setPaymentSuccess(false);
                setPendingPayment(null);
                setIsCartOpen(false);
                router.push("/acompanhar-pedido");
              }}
              className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe59] active:scale-[0.98] text-white font-black py-4 w-full rounded-xl shadow-lg shadow-[#25D366]/20 transition-all mt-3"
            >
              <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.556 4.121 1.528 5.854L0 24l6.316-1.508A11.934 11.934 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.015-1.373l-.36-.214-3.727.979.994-3.636-.234-.374A9.818 9.818 0 1112 21.818z"/>
              </svg>
              Avisar Loja no WhatsApp
            </button>
            <button
              onClick={() => {
                setPaymentSuccess(false);
                setPendingPayment(null);
                setIsCartOpen(false);
                router.push("/acompanhar-pedido");
              }}
              className="w-full mt-2 text-zinc-600 hover:text-zinc-900 bg-zinc-200 py-4 rounded-xl font-bold transition-colors"
            >
              Acompanhar Pedido Pelo Site
            </button>
          </div>
        ) : pendingPayment ? (
          <div className="flex flex-col items-center justify-center p-8 space-y-6 flex-1 overflow-y-auto">
            <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-black text-zinc-900">Aguardando Pagamento</h3>
              <p className="text-zinc-600 text-sm">Escaneie o QR Code abaixo com o aplicativo do seu banco para finalizar a compra no valor de <strong>{BRL(pendingPayment.totalAmount)}</strong>.</p>
            </div>
            <div className="flex flex-col items-center mb-6 w-full">
              <div className="bg-white p-4 rounded-xl mb-4">
                {pendingPayment.pixQrCodeBase64 ? (
                  <img 
                    src={`data:image/png;base64,${pendingPayment.pixQrCodeBase64}`} 
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
                className="w-full bg-white text-center text-zinc-600 text-xs border border-zinc-200 rounded-lg px-3 py-2 outline-none"
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
              className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe59] active:scale-[0.98] text-white font-black py-4 w-full rounded-xl shadow-lg shadow-[#25D366]/20 transition-all mt-3"
            >
              <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.556 4.121 1.528 5.854L0 24l6.316-1.508A11.934 11.934 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.015-1.373l-.36-.214-3.727.979.994-3.636-.234-.374A9.818 9.818 0 1112 21.818z"/>
              </svg>
              Avisar Loja no WhatsApp
            </button>
            <button
              onClick={handleCloseAndReturn}
              className="w-full mt-2 text-zinc-500 hover:text-zinc-900 bg-transparent py-2 font-medium transition-colors"
            >
              Fechar e Voltar ao Cardápio
            </button>
          </div>
        ) : (
          <>
            {/* ── Área scrollável: lista + formulário ── */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-500 py-16">
                  <svg className="w-14 h-14 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <div className="text-center">
                    <p className="font-semibold text-zinc-400">Sua sacola está vazia</p>
                    <p className="text-sm text-zinc-600 mt-1">Adicione um lanche delicioso!</p>
                  </div>
                  <button
                    onClick={() => {
                      setIsCartOpen(false);
                      router.push("/");
                    }}
                    className="bg-[#F6B51B] text-[#07110B] font-bold rounded-xl w-full py-3 mt-6"
                  >
                    Explorar Cardápio
                  </button>
                </div>
              ) : (
                <>
                  {cartItems.map((item) => (
                    <div
                    key={item.id}
                    className="flex gap-3 bg-white rounded-2xl p-3 border border-zinc-200"
                  >
                    {/* Miniatura */}
                    <div className="w-[72px] h-[72px] bg-zinc-100 rounded-xl overflow-hidden flex-shrink-0 border border-zinc-200">
                      {item.product.imageUrl ? (
                        <img
                          src={getImageUrl(item.product.imageUrl)}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-400">
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
                        <h3 className="text-sm font-bold text-zinc-900 leading-tight line-clamp-2">
                          {item.product.name}
                        </h3>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-zinc-400 hover:text-red-500 transition-colors flex-shrink-0"
                          aria-label={`Remover ${item.product.name}`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 mt-2">
                        <span className="text-green-700 font-black text-sm">
                          {BRL((item.product.price + item.addonsTotal) * item.quantity)}
                        </span>
                        {item.addonsSummary && (
                          <span className="w-full text-[11px] text-zinc-500 line-clamp-2">
                            {item.addonsSummary}
                          </span>
                        )}

                        {/* Controles de Quantidade */}
                        <div className="flex items-center gap-2 bg-zinc-100 rounded-lg p-1 border border-zinc-200">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-7 h-7 flex items-center justify-center text-zinc-700 hover:text-zinc-900 bg-zinc-200 hover:bg-zinc-300 rounded-md transition-colors font-bold"
                            aria-label="Diminuir quantidade"
                          >
                            −
                          </button>
                          <span className="text-zinc-900 text-sm font-black w-5 text-center tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-7 h-7 flex items-center justify-center text-[#07110B] bg-[#F6B51B] hover:bg-[#FFD33D] rounded-md transition-colors font-bold"
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
                    className="text-green-700 font-medium py-3 w-full text-center hover:bg-green-50 rounded-xl transition-colors border border-dashed border-green-700/30 mt-2"
                  >
                    + Adicionar mais itens
                  </button>
                </>
              )}
              {/* ── Opção de Entrega (dentro da área scrollável) ── */}
              <div className="flex gap-4 pt-2">
                <label className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl cursor-pointer border transition-colors ${deliveryMode === "DELIVERY" ? "bg-green-50 border-green-600 text-green-700" : "bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-50"}`}>
                  <input type="radio" name="deliveryMode" value="DELIVERY" checked={deliveryMode === "DELIVERY"} onChange={() => setDeliveryMode("DELIVERY")} className="hidden" />
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  <span className="font-bold text-sm">Entregar em Casa</span>
                </label>
                <label className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl cursor-pointer border transition-colors ${deliveryMode === "TAKEOUT" ? "bg-green-50 border-green-600 text-green-700" : "bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-50"}`}>
                  <input type="radio" name="deliveryMode" value="TAKEOUT" checked={deliveryMode === "TAKEOUT"} onChange={() => setDeliveryMode("TAKEOUT")} className="hidden" />
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                  <span className="font-bold text-sm">Retirar na Loja</span>
                </label>
              </div>

              {deliveryMode === "DELIVERY" && (
                <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3">
                  <p className="text-sm font-black text-green-800">Entrega grátis para todos os bairros</p>
                  <p className="mt-1 text-xs font-semibold text-green-700">Seu pedido chega sem taxa extra. Aproveite para pedir mais um acompanhamento.</p>
                </div>
              )}

              <fieldset className="space-y-2 rounded-2xl border border-zinc-200 bg-white p-4">
                <legend className="px-1 text-sm font-black text-zinc-900">FORMA DE PAGAMENTO</legend>
                <div className="grid gap-2 sm:grid-cols-3">
                  {([
                    ["PIX", "Pix", "Pagamento instantâneo"],
                    ["DINHEIRO", "Dinheiro", "Finalize pelo WhatsApp"],
                    ["CARTAO", "Cartão", "WhatsApp + R$ 2,00"],
                  ] as const).map(([method, title, description]) => (
                    <label key={method} className={`cursor-pointer rounded-xl border p-3 transition ${paymentMethod === method ? "border-green-600 bg-green-50 ring-1 ring-green-600" : "border-zinc-200 hover:border-zinc-300"}`}>
                      <input type="radio" name="paymentMethod" value={method} checked={paymentMethod === method} onChange={() => setPaymentMethod(method)} className="sr-only" />
                      <span className="block text-sm font-black text-zinc-900">{title}</span>
                      <span className="mt-1 block text-[11px] leading-tight text-zinc-500">{description}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* Inputs do Visitante */}
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Seu Nome"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-white text-zinc-900 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-shadow placeholder:text-zinc-400"
                />
                <input
                  type="email"
                  placeholder="Seu E-mail (obrigatório)"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full bg-white text-zinc-900 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-shadow placeholder:text-zinc-400"
                />
                <input
                  type="text"
                  placeholder="Seu CPF (só números)"
                  value={customerCpf}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').substring(0, 11);
                    setCustomerCpf(val);
                  }}
                  className="w-full bg-white text-zinc-900 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-shadow placeholder:text-zinc-400"
                />
                <input
                  type="text"
                  placeholder="Seu WhatsApp (ex: 83 99999-9999)"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full bg-white text-zinc-900 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-shadow placeholder:text-zinc-400"
                />
                {deliveryMode === "DELIVERY" && (
                  <>
                    <input
                      type="text"
                      placeholder="Sua Rua"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      className="w-full bg-white text-zinc-900 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-shadow placeholder:text-zinc-400"
                    />
                    <div className="flex gap-3">
                      <input
                        type="text"
                        placeholder="Número"
                        value={number}
                        onChange={(e) => setNumber(e.target.value)}
                        className="w-1/3 bg-white text-zinc-900 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-shadow placeholder:text-zinc-400"
                      />
                      <input
                        type="text"
                        placeholder="Complemento (Opcional)"
                        value={complement}
                        onChange={(e) => setComplement(e.target.value)}
                        className="w-2/3 bg-white text-zinc-900 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-shadow placeholder:text-zinc-400"
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
                    className="w-full bg-white text-zinc-900 border border-zinc-200 rounded-xl px-4 py-3 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-green-500 transition-shadow cursor-pointer"
                    style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center", backgroundSize: "18px", paddingRight: "42px" }}
                  >
                    <option value="" disabled className="bg-white text-zinc-500">
                      Selecione seu bairro...
                    </option>
                    {NEIGHBORHOODS.map((n) => (
                      <option key={n.name} value={n.name} className="bg-white text-zinc-900">
                        {n.name} — {n.fee === 0 ? "Grátis" : BRL(n.fee)}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* ── Footer fixo: Totais + Botão (shrink-0 — sempre visível) ── */}
            <div className="px-6 py-5 bg-white border-t border-zinc-200 space-y-4 shrink-0">
              {/* Resumo de Valores */}
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between text-zinc-500">
                  <span className="font-medium">Subtotal</span>
                  <span className="text-zinc-900 font-semibold">{BRL(subtotal)}</span>
                </div>
                <div className="flex justify-between text-zinc-500">
                  <span className="font-medium">Taxa de entrega</span>
                  <span className={deliveryMode === "TAKEOUT" || deliveryNeighborhood ? "text-zinc-900 font-semibold" : "text-zinc-400 italic"}>
                    {deliveryMode === "TAKEOUT" ? "Grátis (Retirada)" : (deliveryNeighborhood ? (deliveryFee === 0 ? "Grátis" : BRL(deliveryFee)) : "Selecione um bairro")}
                  </span>
                </div>
                {paymentSurcharge > 0 && <div className="flex justify-between text-zinc-500">
                  <span className="font-medium">Acréscimo cartão</span>
                  <span className="font-semibold text-zinc-900">{BRL(paymentSurcharge)}</span>
                </div>}
                <div className="flex justify-between pt-3 border-t border-zinc-200 items-center">
                  <span className="text-zinc-900 font-bold">Total</span>
                  <span className="text-2xl font-black text-green-700 tabular-nums">{BRL(orderTotal)}</span>
                </div>
              </div>

              {/* Botão Finalizar via API */}
              <button
                onClick={handleCheckout}
                disabled={!isStoreOpen || !isValidToSubmit || isProcessing}
                className={`w-full flex items-center justify-center gap-2.5 font-black py-4 rounded-xl shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed ${!isStoreOpen ? "bg-red-600 text-white shadow-red-600/10" : "bg-[#F6B51B] hover:bg-[#FFD33D] active:scale-[0.98] text-[#07110B] shadow-[#F6B51B]/10"}`}
              >
                {!isStoreOpen ? "Loja Fechada no momento" : (isProcessing ? "Processando..." : paymentMethod === "PIX" ? "Finalizar Pedido via Pix" : "Finalizar e ir para o WhatsApp")}
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
