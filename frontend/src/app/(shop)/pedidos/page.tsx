"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/contexts/CartContext";

import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import Link from "next/link";

type Neighborhood = {
  id: number;
  name: string;
  deliveryFee: number;
};

type Order = {
  id: number;
  neighborhood: Neighborhood;
  totalAmount: number;
  paymentStatus: string;
  orderStatus: string;
  createdAt: string;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "PENDING": return "bg-[#F1C40F] text-[#121212]";
    case "PREPARING": return "bg-[#3B82F6] text-white";
    case "DISPATCHED": return "bg-[#10B981] text-white";
    case "DELIVERED": return "bg-gray-500 text-white";
    default: return "bg-gray-700 text-gray-300";
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "PENDING": return "Aguardando Confirmação";
    case "PREPARING": return "Em Preparo";
    case "DISPATCHED": return "Saiu para Entrega";
    case "DELIVERED": return "Entregue";
    default: return status;
  }
};

const getProgressWidth = (status: string) => {
  switch (status) {
    case "PENDING": return "25%";
    case "PREPARING": return "50%";
    case "DISPATCHED": return "75%";
    case "DELIVERED": return "100%";
    default: return "0%";
  }
};

export default function ShopHome() {
  const { setIsCartOpen, cartItems } = useCart();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const baseUrl = "/api";
    fetch(`${baseUrl}/orders/customer/1`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data) => {
        setOrders(data);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (orders.length === 0) return;

    const client = new Client({
      webSocketFactory: () => {
        const wsUrl = "/ws";
        return new SockJS(wsUrl);
      },
      debug: (str) => console.log("STOMP: " + str),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = () => {
      orders.forEach(order => {
        // Subscreve ao tópico de cada pedido
        client.subscribe(`/topic/orders/status/${order.id}`, (message) => {
          if (message.body) {
            const data = JSON.parse(message.body);
            setOrders(prevOrders => 
              prevOrders.map(o => {
                if (o.id === order.id) {
                  return {
                    ...o,
                    orderStatus: data.status || o.orderStatus,
                    paymentStatus: data.paymentStatus || o.paymentStatus
                  };
                }
                return o;
              })
            );
          }
        });
      });
    };

    client.activate();

    return () => {
      client.deactivate();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders.length]); // Depende do tamanho para não re-subscrever a cada atualização de status

  if (loading) {
    return (
      <main className="min-h-screen bg-[#121212] flex flex-col items-center justify-center font-sans text-[#FFFFFF]">
        <div className="w-16 h-16 border-4 border-[#F1C40F] border-t-transparent rounded-full animate-spin mb-6"></div>
        <h1 className="text-2xl font-medium tracking-tight">
          Procurando seus pedidos na cozinha...
        </h1>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[#121212] flex flex-col items-center justify-center p-6 font-sans text-[#FFFFFF]">
        <div className="bg-[#1e1e1e] p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.5)] max-w-md text-center border border-gray-800">
          <h1 className="text-2xl font-bold mb-2 tracking-tight">
            Ops, sistema offline
          </h1>
          <p className="text-gray-400">
            Não conseguimos conectar ao nosso sistema no momento. Tente novamente mais tarde.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#121212] p-6 md:p-12 font-sans text-[#FFFFFF]">
      <div className="max-w-5xl mx-auto">
        <header className="flex flex-col items-center justify-center mb-12 border-b border-gray-800 pb-8 text-center">
          <img src="/images/bairam-logo.jpg.jpg" alt="Logo Bairamburguer" className="h-20 w-auto mb-6 rounded-lg" />
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            Meus Pedidos Bairamburguer
          </h1>
          <p className="mt-4 text-gray-400 font-medium">
            Acompanhe a sua felicidade em forma de lanche.
          </p>
        </header>

        {orders.length === 0 ? (
          <div className="text-center py-20 bg-[#1e1e1e] rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.5)] border border-gray-800">
            <p className="text-gray-400 text-lg">Você ainda não fez nenhum pedido.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.map((order) => (
              <div 
                key={order.id} 
                className="bg-[#1e1e1e] rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-gray-800 hover:shadow-[0_8px_30px_rgb(241,196,15,0.05)] transition-all duration-300 flex flex-col relative overflow-hidden"
              >
                {/* Progress Bar na base do cartão */}
                <div className="absolute bottom-0 left-0 h-1.5 bg-gray-800 w-full">
                   <div 
                     className="h-full bg-[#F1C40F] transition-all duration-1000 ease-in-out" 
                     style={{ width: getProgressWidth(order.orderStatus) }}
                   ></div>
                </div>

                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                      Pedido #{order.id}
                    </span>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(order.orderStatus)} transition-colors duration-500`}>
                      {getStatusLabel(order.orderStatus)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                      Total
                    </span>
                    <span className="text-2xl font-black text-[#F1C40F]">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.totalAmount)}
                    </span>
                  </div>
                </div>

                <div className="space-y-4 mb-6 flex-grow">
                  <div className="flex items-center text-gray-300">
                    <svg className="w-5 h-5 mr-3 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="font-medium">{order.neighborhood?.name || "Bairro não informado"}</span>
                  </div>
                  <div className="flex items-center text-gray-300">
                    <svg className="w-5 h-5 mr-3 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <span className="font-medium">Pagamento: {order.paymentStatus === "PAID" ? "Aprovado" : "Pendente"}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-800 mt-auto text-xs text-gray-500 font-medium mb-1">
                  {order.createdAt ? `Criado em ${new Date(order.createdAt).toLocaleDateString('pt-BR')} às ${new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : "Data não disponível"}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 w-full bg-[#121212] border-t border-[#1e1e1e] flex justify-around items-center h-16 pb-safe z-40">
        <Link href="/" className="flex flex-col items-center justify-center w-full h-full text-gray-500 hover:text-gray-400">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </Link>
        
        <Link href="/pedidos" className="flex flex-col items-center justify-center w-full h-full text-[#F1C40F]">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </Link>

        <button 
          onClick={() => setIsCartOpen(true)}
          className="flex flex-col items-center justify-center w-full h-full text-gray-500 hover:text-gray-400 relative"
        >
          <div className="relative">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            {cartItems.reduce((acc, item) => acc + item.quantity, 0) > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-[#F1C40F] text-[#121212] text-[10px] font-black w-[18px] h-[18px] flex items-center justify-center rounded-full border-2 border-[#121212]">
                {cartItems.reduce((acc, item) => acc + item.quantity, 0)}
              </span>
            )}
          </div>
        </button>

        <button className="flex flex-col items-center justify-center w-full h-full text-gray-500 hover:text-gray-400">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </button>
      </nav>
    </main>
  );
}
