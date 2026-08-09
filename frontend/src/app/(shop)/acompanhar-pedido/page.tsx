"use client";

import { useEffect, useState } from "react";
import { 
  Search, Clock, CheckCircle, Truck, Utensils, 
  MapPin, User, DollarSign, ClipboardList, AlertTriangle 
} from "lucide-react";
import Link from "next/link";
import { formatStoreDateTime } from "@/lib/storeTime";

interface TrackItem {
  productName: string;
  quantity: number;
  price: number;
  addonsSummary?: string;
  addonsTotal: number;
  subtotal: number;
}

interface TrackResponse {
  id: number;
  orderStatus: string;
  paymentStatus: string;
  statusLabel: string;
  customerName: string;
  customerPhoneMasked: string;
  deliveryMode: string;
  addressSummary: string;
  items: TrackItem[];
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  createdAt: string;
}

export default function AcompanharPedidoPage() {
  const [orderId, setOrderId] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<TrackResponse | null>(null);

  // Prefill order ID and phone if available
  useEffect(() => {
    const savedOrderId = localStorage.getItem("lastOrderId");
    const savedPhone = sessionStorage.getItem("lastOrderPhone");
    const timer = setTimeout(() => {
      if (savedOrderId) setOrderId(savedOrderId);
      if (savedPhone) setPhone(savedPhone);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 11) value = value.slice(0, 11);
    
    // Format: (XX) XXXXX-XXXX
    if (value.length > 6) {
      value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
    } else if (value.length > 2) {
      value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
    } else if (value.length > 0) {
      value = `(${value}`;
    }
    setPhone(value);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim() || !phone.trim()) {
      setError("Por favor, preencha todos os campos.");
      return;
    }

    setLoading(true);
    setError("");
    setOrder(null);

    // Clean phone for sending (only numbers)
    const cleanPhone = phone.replace(/\D/g, "");

    try {
      const baseUrl = "/api";
      const res = await fetch(`${baseUrl}/orders/track`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          orderId: parseInt(orderId.trim(), 10), 
          phone: cleanPhone 
        })
      });

      if (!res.ok) {
        throw new Error("Pedido não encontrado. Confira o número do pedido e telefone.");
      }

      const data: TrackResponse = await res.json();
      setOrder(data);
      
      // Save phone to sessionStorage for future queries in this session
      sessionStorage.setItem("lastOrderPhone", phone);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Ocorreu um erro ao buscar o pedido.";
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const getStatusStep = (status: string) => {
    switch (status) {
      case "PENDING":
      case "RCVD":
        return 1;
      case "PREPARING":
      case "IN_PRODUCTION":
        return 2;
      case "DISPATCHED":
      case "OUT_FOR_DELIVERY":
        return 3;
      case "DELIVERED":
        return 4;
      default:
        return 0; // Canceled
    }
  };

  const currentStep = order ? getStatusStep(order.orderStatus) : 0;
  const isCanceled = order?.orderStatus === "CANCELED" || order?.orderStatus === "CANCELLED";

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 text-zinc-900 min-h-[80vh]">
      {!order ? (
        <div className="max-w-md mx-auto bg-white text-zinc-900 rounded-2xl border border-zinc-200 shadow-2xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-green-700">Acompanhar Pedido</h1>
            <p className="text-zinc-500 text-sm">Insira os dados do seu pedido para visualizar o status em tempo real.</p>
          </div>

          <form onSubmit={handleSearch} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="orderId" className="text-sm font-semibold text-zinc-700">Número do Pedido (ID)</label>
              <input
                id="orderId"
                type="number"
                placeholder="Ex: 1024"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-zinc-900 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-semibold text-zinc-700">WhatsApp / Telefone</label>
              <input
                id="phone"
                type="text"
                placeholder="(83) 99999-9999"
                value={phone}
                onChange={handlePhoneChange}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-zinc-900 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-sm flex gap-3 items-center">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Buscando...</span>
              ) : (
                <>
                  <Search className="w-5 h-5" /> Acompanhar Pedido
                </>
              )}
            </button>
          </form>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Acompanhamento</span>
              <h1 className="text-2xl font-black text-zinc-900 flex items-center gap-2">
                Pedido <span className="text-green-700">#{order.id}</span>
              </h1>
              <p className="text-xs text-zinc-500">Criado em {formatStoreDateTime(order.createdAt)}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setOrder(null)}
                className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold px-5 py-2.5 rounded-xl text-sm transition-all"
              >
                Nova Consulta
              </button>
              <Link
                href="/"
                className="bg-green-600 hover:bg-green-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all flex items-center justify-center"
              >
                Ir para o Início
              </Link>
            </div>
          </div>

          {/* Status Progress Tracker */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-8 shadow-xl">
            {isCanceled ? (
              <div className="bg-red-50 border border-red-200 text-red-600 p-6 rounded-xl text-center space-y-2">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
                <h3 className="text-xl font-bold">Pedido Cancelado</h3>
                <p className="text-sm text-zinc-500 max-w-md mx-auto">Este pedido foi cancelado. Se tiver dúvidas, entre em contato pelo nosso suporte.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center">
                  <span className="text-sm text-zinc-500">Status Atual:</span>
                  <h2 className="text-3xl font-black text-green-700 mt-1">{order.statusLabel}</h2>
                </div>

                {/* Progress bar */}
                <div className="relative pt-4">
                  <div className="absolute top-1/2 left-0 right-0 h-1 bg-zinc-200 transform -translate-y-1/2 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-600 transition-all duration-500" 
                      style={{ width: `${(currentStep - 1) * 33.33}%` }}
                    />
                  </div>

                  <div className="relative flex justify-between">
                    {[
                      { step: 1, label: "Confirmado", icon: CheckCircle },
                      { step: 2, label: "Em Preparo", icon: Utensils },
                      { step: 3, label: "Saiu p/ Entrega", icon: Truck },
                      { step: 4, label: "Entregue", icon: CheckCircle }
                    ].map((s) => {
                      const Icon = s.icon;
                      const active = currentStep >= s.step;
                      return (
                        <div key={s.step} className="flex flex-col items-center space-y-2 relative z-10">
                          <div 
                            className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${
                              active 
                                ? "bg-green-600 border-green-600 text-white shadow-lg shadow-green-600/15" 
                                : "bg-white border-zinc-200 text-zinc-400"
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <span className={`text-[11px] md:text-xs font-bold transition-all ${active ? "text-zinc-900" : "text-zinc-500"}`}>
                            {s.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Order Items & Calculations */}
            <div className="md:col-span-2 bg-white text-zinc-900 rounded-2xl border border-zinc-200 shadow-xl overflow-hidden flex flex-col">
              <div className="p-6 border-b border-zinc-200 bg-zinc-50 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-green-700" />
                <h3 className="font-bold text-zinc-900">Resumo dos Itens</h3>
              </div>
              <div className="p-6 space-y-4 flex-grow overflow-y-auto max-h-[350px]">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start pb-4 border-b border-zinc-200 last:border-0 last:pb-0">
                    <div className="space-y-1">
                      <div className="font-semibold text-zinc-900 flex items-center gap-2">
                        <span className="text-zinc-500 text-sm font-bold">{item.quantity}x</span>
                        {item.productName}
                      </div>
                      {item.addonsSummary && (
                        <p className="text-xs text-zinc-500 italic pl-6">{item.addonsSummary}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-zinc-700">R$ {item.subtotal.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-6 bg-zinc-50 border-t border-zinc-200 space-y-2 text-sm text-zinc-500">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-zinc-900">R$ {order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxa de Entrega</span>
                  <span className="text-zinc-900">
                    {order.deliveryFee > 0 ? `R$ ${order.deliveryFee.toFixed(2)}` : "Grátis"}
                  </span>
                </div>
                <div className="flex justify-between text-base font-black text-zinc-900 pt-2 border-t border-zinc-200">
                  <span>Total</span>
                  <span className="text-green-700">R$ {order.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Delivery/Takeout & Customer Info */}
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-xl p-6 space-y-6">
              <div className="space-y-4">
                <h3 className="font-bold text-zinc-900 border-b border-zinc-200 pb-2">Destinatário</h3>
                
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-zinc-500 mt-0.5" />
                  <div>
                    <h4 className="text-xs text-zinc-500 font-bold uppercase">Cliente</h4>
                    <p className="text-sm font-semibold text-zinc-700">{order.customerName}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-zinc-500 mt-0.5" />
                  <div>
                    <h4 className="text-xs text-zinc-500 font-bold uppercase">Telefone</h4>
                    <p className="text-sm font-semibold text-zinc-700">{order.customerPhoneMasked}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-zinc-900 border-b border-zinc-200 pb-2">Modo de Entrega</h3>
                
                <div className="flex items-start gap-3">
                  {order.deliveryMode === "ENTREGA" ? (
                    <>
                      <MapPin className="w-5 h-5 text-zinc-500 mt-0.5" />
                      <div>
                        <h4 className="text-xs text-zinc-500 font-bold uppercase">Endereço de Entrega</h4>
                        <p className="text-sm font-semibold text-zinc-700 leading-relaxed">{order.addressSummary}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <Clock className="w-5 h-5 text-zinc-500 mt-0.5" />
                      <div>
                        <h4 className="text-xs text-zinc-500 font-bold uppercase">Retirada na Loja</h4>
                        <p className="text-sm font-semibold text-zinc-700 leading-relaxed">
                          Seu pedido estará disponível para retirada em nossa loja assim que o status for &apos;Entregue&apos; ou &apos;Pedido em preparo&apos;.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-zinc-900 border-b border-zinc-200 pb-2">Status do Pagamento</h3>
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-zinc-500" />
                  <div>
                    <span 
                      className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        order.paymentStatus === "PAID" 
                          ? "bg-green-50 text-green-700 border border-green-200" 
                          : "bg-yellow-50 text-yellow-700 border border-yellow-200"
                      }`}
                    >
                      {order.paymentStatus === "PAID" ? "PAGO" : "PENDENTE"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
