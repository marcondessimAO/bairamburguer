"use client";

import { useEffect, useState } from "react";

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

export default function ShopHome() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("http://localhost:8080/api/orders/customer/1")
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
                className="bg-[#1e1e1e] rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-gray-800 hover:shadow-[0_8px_30px_rgb(241,196,15,0.05)] transition-all duration-300 flex flex-col"
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                      Pedido #{order.id}
                    </span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#2A2A2A] text-[#F1C40F]">
                      {order.orderStatus}
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
                    <span className="font-medium">Pagamento: {order.paymentStatus}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-800 mt-auto text-xs text-gray-500 font-medium">
                  {order.createdAt ? `Criado em ${new Date(order.createdAt).toLocaleDateString('pt-BR')} às ${new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : "Data não disponível"}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
