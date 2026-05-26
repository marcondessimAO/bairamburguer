"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { removeAuthToken } from "@/services/auth";
import { adminService, OrderDTO } from "@/services/admin";
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export default function AdminDashboard() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const stompClientRef = useRef<Client | null>(null);

  const handleLogout = () => {
    removeAuthToken();
    router.push("/login");
  };

  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.3);
      
      gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      console.error("Audio playback failed", e);
    }
  };

  useEffect(() => {

    // Carregar Pedidos
    adminService.getOrders()
      .then((data) => {
        setOrders(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Erro ao carregar pedidos", err);
        setLoading(false);
      });

    // Iniciar WebSocket
    const socketUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '/ws') || 'http://localhost:8080/ws';
    const client = new Client({
      webSocketFactory: () => new SockJS(socketUrl),
      reconnectDelay: 5000,
      onConnect: () => {
        console.log("WebSocket Conectado!");

        client.subscribe('/topic/orders/new', (message) => {
          const newOrder: OrderDTO = JSON.parse(message.body);
          setOrders((prev) => {
            const exists = prev.find(o => o.id === newOrder.id);
            if (exists) return prev.map(o => o.id === newOrder.id ? newOrder : o);
            return [...prev, newOrder];
          });
          playBeep(); // Tocar o som para nova ordem
        });

        client.subscribe('/topic/orders/update', (message) => {
          const updatedOrder: OrderDTO = JSON.parse(message.body);
          setOrders((prev) => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
        });
      },
      onStompError: (frame) => {
        console.error('STOMP Error:', frame);
      }
    });

    client.activate();
    stompClientRef.current = client;

    return () => {
      client.deactivate();
    };
  }, []);

  const handleAdvanceStatus = async (orderId: number, currentStatus: string) => {
    const flow = ["PENDING", "PREPARING", "DISPATCHED", "DELIVERED"];
    const currentIndex = flow.indexOf(currentStatus);
    if (currentIndex === -1 || currentIndex >= flow.length - 1) return;
    
    const nextStatus = flow[currentIndex + 1];
    try {
      const updatedOrder = await adminService.updateOrderStatus(orderId, nextStatus);
      setOrders((prev) => prev.map(o => o.id === orderId ? updatedOrder : o));
    } catch (e) {
      alert("Erro ao avançar o status.");
    }
  };

  const colorMap: Record<string, { bg: string, text: string, border: string, btnBg: string, btnHover: string }> = {
    "#F1C40F": { bg: "bg-[#1E1E1E]", text: "text-[#F1C40F]", border: "border-[#F1C40F]/20", btnBg: "bg-[#F1C40F]/10", btnHover: "hover:bg-[#F1C40F] hover:text-[#121212]" },
    "#3B82F6": { bg: "bg-[#1E1E1E]", text: "text-[#3B82F6]", border: "border-[#3B82F6]/20", btnBg: "bg-[#3B82F6]/10", btnHover: "hover:bg-[#3B82F6] hover:text-[#121212]" },
    "#10B981": { bg: "bg-[#1E1E1E]", text: "text-[#10B981]", border: "border-[#10B981]/20", btnBg: "bg-[#10B981]/10", btnHover: "hover:bg-[#10B981] hover:text-[#121212]" },
  };

  const renderCard = (order: OrderDTO, colorHex: string, buttonText: string) => {
    const colors = colorMap[colorHex];
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
          <ul className="space-y-1">
            {order.items?.map(item => (
              <li key={item.id} className="flex justify-between">
                <span>{item.quantity}x {item.product.name}</span>
              </li>
            ))}
          </ul>
        </div>

        <button
          onClick={() => handleAdvanceStatus(order.id, order.orderStatus)}
          className={`w-full py-2.5 rounded-lg font-bold transition-all ${colors.btnBg} ${colors.text} ${colors.btnHover} border ${colors.border}`}
        >
          {buttonText}
        </button>
      </div>
    );
  };

  const getButtonText = (status: string) => {
    if (status === "PENDING") return "Iniciar Preparo";
    if (status === "PREPARING") return "Despachar p/ Entrega";
    if (status === "DISPATCHED") return "Marcar como Entregue";
    return "Finalizado";
  };



  const pendentes = orders.filter(o => o.orderStatus === "PENDING");
  const preparo = orders.filter(o => o.orderStatus === "PREPARING");
  const entrega = orders.filter(o => o.orderStatus === "DISPATCHED");

  return (
    <div className="min-h-screen bg-[#121212] text-white p-4 font-sans">
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
                EM PREPARO
              </h2>
              <span className="bg-[#3B82F6]/20 text-[#3B82F6] px-2 py-1 rounded-md text-xs font-bold">{preparo.length}</span>
            </div>
            <div className="overflow-y-auto pr-2 pb-20 flex-1 custom-scrollbar">
              {preparo.map(order => renderCard(order, "#3B82F6", getButtonText("PREPARING")))}
              {preparo.length === 0 && (
                <div className="text-center text-gray-500 mt-10 text-sm">Nenhum pedido em preparo</div>
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
