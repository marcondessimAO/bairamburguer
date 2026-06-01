"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { removeAuthToken } from "@/services/auth";
import { adminService, OrderDTO } from "@/services/admin";

export default function AdminDashboard() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusError, setStatusError] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
  const [isSoundEnabled, setIsSoundEnabled] = useState(false);
  const previousCountRef = useRef<number>(0);

  const handleLogout = () => {
    removeAuthToken();
    router.push("/login");
  };

  const playBeep = () => {
    try {
      const audio = new Audio("/sounds/campainha.mp3");
      audio.volume = 1.0;
      audio.play().catch(e => console.warn("Audio bloqueado pelo browser (interação necessária):", e));
    } catch (e) {
      console.error("Audio playback failed", e);
    }
  };

  const handleEnableSound = () => {
    setIsSoundEnabled(true);
    // Play a silent or initial beep to unlock audio context in Safari/Chrome
    playBeep();
  };

  useEffect(() => {

    // Carregar Pedidos
    adminService.getOrders()
      .then((data) => {
        setOrders(data);
        previousCountRef.current = data.length;
        setLoading(false);
      })
      .catch((err) => {
        console.error("Erro ao carregar pedidos", err);
        setLoading(false);
      });

    // HTTP Polling a cada 10 segundos
    const intervalId = setInterval(() => {
      adminService.getOrders()
        .then((data) => {
          setOrders(data);
          if (data.length > previousCountRef.current) {
            playBeep(); // Novo pedido chegou!
          }
          previousCountRef.current = data.length;
        })
        .catch((err) => {
          console.error("Erro no polling de pedidos", err);
        });
    }, 10000);

    return () => clearInterval(intervalId);
  }, []);

  const handleAdvanceStatus = async (orderId: number, currentStatus: string) => {
    const flow = ["PENDING", "PREPARING", "DISPATCHED", "DELIVERED"];
    const currentIndex = flow.indexOf(currentStatus);
    if (currentIndex === -1 || currentIndex >= flow.length - 1) return;
    
    const nextStatus = flow[currentIndex + 1];
    setStatusError("");
    setUpdatingOrderId(orderId);
    try {
      const updatedOrder = await adminService.updateOrderStatus(orderId, nextStatus);
      setOrders((prev) => prev.map(o => o.id === orderId ? updatedOrder : o));
      const refreshedOrders = await adminService.getOrders();
      setOrders(refreshedOrders);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Falha ao atualizar o pedido";
      setStatusError(`Nao foi possivel avancar o pedido #${orderId}. ${message}`);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const colorMap: Record<string, { bg: string, text: string, border: string, btnBg: string, btnHover: string }> = {
    "#F1C40F": { bg: "bg-[#1E1E1E]", text: "text-[#F1C40F]", border: "border-[#F1C40F]/20", btnBg: "bg-[#F1C40F]/10", btnHover: "hover:bg-[#F1C40F] hover:text-[#121212]" },
    "#3B82F6": { bg: "bg-[#1E1E1E]", text: "text-[#3B82F6]", border: "border-[#3B82F6]/20", btnBg: "bg-[#3B82F6]/10", btnHover: "hover:bg-[#3B82F6] hover:text-[#121212]" },
    "#10B981": { bg: "bg-[#1E1E1E]", text: "text-[#10B981]", border: "border-[#10B981]/20", btnBg: "bg-[#10B981]/10", btnHover: "hover:bg-[#10B981] hover:text-[#121212]" },
  };

  const renderCard = (order: OrderDTO, colorHex: string, buttonText: string) => {
    const colors = colorMap[colorHex];
    const subtotal = order.items?.reduce((sum, item) => sum + Number(item.subtotal || 0), 0) ?? 0;
    const total = Number(order.totalAmount || 0);
    const deliveryFee = Math.max(total - subtotal, 0);
    const address = [order.street, order.number, order.complement].filter(Boolean).join(", ");
    const isUpdating = updatingOrderId === order.id;
    return (
      <div key={order.id} className={`${colors.bg} p-4 rounded-xl border ${colors.border} shadow-lg mb-4 flex flex-col`}>
        <div className="flex justify-between items-start mb-3">
          <div>
            <span className={`${colors.text} font-black text-lg`}>#{order.id}</span>
            <h3 className="text-white font-bold">{order.customerName}</h3>
          </div>
          <span className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        
        <div className="text-sm text-gray-300 mb-4 bg-black/30 p-2 rounded-lg">
          <p className="font-semibold text-gray-100 mb-1">📍 {order.neighborhood?.name || "Bairro não informado"}</p>
          {address && <p className="text-xs text-gray-400 mb-2">{address}</p>}
          <ul className="space-y-1">
            {order.items?.map(item => (
              <li key={item.id} className="flex justify-between">
                <span>{item.quantity}x {item.product.name}</span>
                <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(item.subtotal || 0))}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 pt-3 border-t border-gray-800 space-y-1 text-xs">
            <div className="flex justify-between text-gray-400">
              <span>Frete</span>
              <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(deliveryFee)}</span>
            </div>
            <div className="flex justify-between text-gray-100 font-black">
              <span>Total</span>
              <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => handleAdvanceStatus(order.id, order.orderStatus)}
          disabled={isUpdating}
          className={`w-full py-2.5 rounded-lg font-bold transition-all ${colors.btnBg} ${colors.text} ${colors.btnHover} border ${colors.border} disabled:opacity-50 disabled:cursor-wait`}
        >
          {isUpdating ? "Atualizando..." : buttonText}
        </button>
      </div>
    );
  };

  const getButtonText = (status: string) => {
    if (status === "PENDING") return "Iniciar Produção";
    if (status === "PREPARING") return "Despachar p/ Entrega";
    if (status === "DISPATCHED") return "Marcar como Entregue";
    return "Finalizado";
  };



  const pendentes = orders.filter(o => o.orderStatus === "PENDING");
  const preparo = orders.filter(o => o.orderStatus === "PREPARING");
  const entrega = orders.filter(o => o.orderStatus === "DISPATCHED");

  return (
    <div className="min-h-screen bg-[#121212] text-white p-4 font-sans relative">
      {!isSoundEnabled && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-[#1A1A1A] p-8 rounded-2xl text-center max-w-md border border-[#333]">
            <div className="w-20 h-20 bg-[#F1C40F]/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-[#F1C40F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">Ativar Alertas Sonoros</h2>
            <p className="text-gray-400 mb-8">Para que a campainha toque quando chegar um novo pedido, precisamos da sua permissão para reproduzir áudio.</p>
            <button 
              onClick={handleEnableSound}
              className="w-full bg-[#F1C40F] text-[#121212] font-black py-4 rounded-xl hover:bg-[#F39C12] transition-colors text-lg"
            >
              Ativar Som e Entrar
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#F1C40F] rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-[#121212]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-black">Cozinha & Expedição</h1>
        </div>
        <button onClick={handleLogout} className="text-gray-400 hover:text-white border border-gray-700 px-4 py-2 rounded-lg text-sm font-bold">
          Encerrar Expediente
        </button>
      </div>

      {statusError && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-200">
          {statusError}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-[#F1C40F] border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-120px)]">
          {/* Coluna PENDENTES */}
          <div className="flex flex-col bg-[#1A1A1A] rounded-2xl border border-gray-800 p-4 h-full overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-[#F1C40F] font-black text-lg flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#F1C40F] animate-pulse"></div>
                PENDENTES
              </h2>
              <span className="bg-[#F1C40F]/20 text-[#F1C40F] px-2 py-1 rounded-md text-xs font-bold">{pendentes.length}</span>
            </div>
            <div className="overflow-y-auto pr-2 pb-20 flex-1 custom-scrollbar">
              {pendentes.map(order => (
                <div key={order.id} className="animate-[pulse_2s_ease-in-out_1]">
                  {renderCard(order, "#F1C40F", getButtonText("PENDING"))}
                </div>
              ))}
              {pendentes.length === 0 && (
                <div className="text-center text-gray-500 mt-10 text-sm">Sem pedidos pendentes</div>
              )}
            </div>
          </div>

          {/* Coluna PREPARO */}
          <div className="flex flex-col bg-[#1A1A1A] rounded-2xl border border-gray-800 p-4 h-full overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-[#3B82F6] font-black text-lg flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#3B82F6]"></div>
                EM PRODUÇÃO
              </h2>
              <span className="bg-[#3B82F6]/20 text-[#3B82F6] px-2 py-1 rounded-md text-xs font-bold">{preparo.length}</span>
            </div>
            <div className="overflow-y-auto pr-2 pb-20 flex-1 custom-scrollbar">
              {preparo.map(order => renderCard(order, "#3B82F6", getButtonText("PREPARING")))}
              {preparo.length === 0 && (
                <div className="text-center text-gray-500 mt-10 text-sm">Nenhum pedido em produção</div>
              )}
            </div>
          </div>

          {/* Coluna ENTREGA */}
          <div className="flex flex-col bg-[#1A1A1A] rounded-2xl border border-gray-800 p-4 h-full overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-[#10B981] font-black text-lg flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#10B981]"></div>
                SAIU PARA ENTREGA
              </h2>
              <span className="bg-[#10B981]/20 text-[#10B981] px-2 py-1 rounded-md text-xs font-bold">{entrega.length}</span>
            </div>
            <div className="overflow-y-auto pr-2 pb-20 flex-1 custom-scrollbar">
              {entrega.map(order => renderCard(order, "#10B981", getButtonText("DISPATCHED")))}
              {entrega.length === 0 && (
                <div className="text-center text-gray-500 mt-10 text-sm">Nenhum pedido em trânsito</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
