"use client";

import { useEffect, useState } from "react";
import { fetchWithAuth } from "@/services/api";
import { DollarSign, ShoppingBag, Receipt, Trophy } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

type DateRevenueDTO = {
  date: string;
  revenue: number;
};

type TopProductDTO = {
  name: string;
  quantity: number;
  revenue: number;
};

type DashboardMetrics = {
  totalRevenue: number;
  totalOrders: number;
  averageTicket: number;
  revenueHistory: DateRevenueDTO[];
  topProducts: TopProductDTO[];
};

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchWithAuth("/v1/admin/dashboard/metrics")
      .then((res) => {
        if (!res.ok) {
          console.error("Erro na API - Status:", res.status, res.statusText);
          throw new Error(`Falha ao buscar métricas: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        setMetrics(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Erro detalhado da API no Dashboard:", err);
        setError(true);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="w-12 h-12 border-4 border-[#F1C40F] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="bg-[#1e1e1e] p-8 rounded-2xl border border-zinc-800">
          <h2 className="text-xl font-bold text-red-400 mb-2">Erro ao carregar o Dashboard</h2>
          <p className="text-zinc-400">Verifique se a API está a funcionar corretamente.</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <header>
        <h1 className="text-3xl font-black text-zinc-100 tracking-tight">Dashboard</h1>
        <p className="text-zinc-400 mt-1">Visão geral do negócio (Mês Atual)</p>
      </header>

      {/* Grid Superior: Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Faturamento */}
        <div className="bg-[#1E1E1E] p-6 rounded-2xl border border-zinc-800 shadow-[0_4px_20px_rgba(0,0,0,0.3)] flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-zinc-800/50 flex items-center justify-center border border-zinc-700">
            <DollarSign className="w-7 h-7 text-green-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-400">Faturamento Total</p>
            <h3 className="text-2xl font-black text-zinc-100 mt-1">
              {formatCurrency(metrics.totalRevenue)}
            </h3>
          </div>
        </div>

        {/* Quantidade de Pedidos */}
        <div className="bg-[#1E1E1E] p-6 rounded-2xl border border-zinc-800 shadow-[0_4px_20px_rgba(0,0,0,0.3)] flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-zinc-800/50 flex items-center justify-center border border-zinc-700">
            <ShoppingBag className="w-7 h-7 text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-400">Pedidos Recebidos</p>
            <h3 className="text-2xl font-black text-zinc-100 mt-1">
              {metrics.totalOrders}
            </h3>
          </div>
        </div>

        {/* Ticket Médio */}
        <div className="bg-[#1E1E1E] p-6 rounded-2xl border border-zinc-800 shadow-[0_4px_20px_rgba(0,0,0,0.3)] flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-zinc-800/50 flex items-center justify-center border border-zinc-700">
            <Receipt className="w-7 h-7 text-purple-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-400">Ticket Médio</p>
            <h3 className="text-2xl font-black text-zinc-100 mt-1">
              {formatCurrency(metrics.averageTicket)}
            </h3>
          </div>
        </div>
      </div>

      {/* Grid Inferior: Gráficos e Tabelas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Gráfico de Vendas (Ocupa 2 colunas no Desktop) */}
        <div className="lg:col-span-2 bg-[#1E1E1E] p-6 rounded-2xl border border-zinc-800 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
          <h2 className="text-xl font-bold text-zinc-100 mb-6 flex items-center gap-2">
            Evolução de Vendas <span className="text-sm font-normal text-zinc-500">(Últimos 7 dias)</span>
          </h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.revenueHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#71717a" 
                  tick={{ fill: '#71717a' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="#71717a" 
                  tick={{ fill: '#71717a' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `R$ ${value}`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#121212', borderColor: '#2a2a2a', borderRadius: '12px', color: '#fff' }}
                  itemStyle={{ color: '#F1C40F', fontWeight: 'bold' }}
                  formatter={(value: number | string | readonly (number | string)[] | undefined) => [formatCurrency(Number(value) || 0), 'Faturamento']}
                  labelStyle={{ color: '#a1a1aa', marginBottom: '4px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#F1C40F" 
                  strokeWidth={4} 
                  dot={{ fill: '#1E1E1E', stroke: '#F1C40F', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#F1C40F', stroke: '#fff' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top 5 Produtos (Ocupa 1 coluna) */}
        <div className="bg-[#1E1E1E] p-6 rounded-2xl border border-zinc-800 shadow-[0_4px_20px_rgba(0,0,0,0.3)] flex flex-col">
          <h2 className="text-xl font-bold text-zinc-100 mb-6 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#F1C40F]" /> Top 5 Produtos
          </h2>
          
          {metrics.topProducts.length === 0 ? (
            <p className="text-zinc-500 text-center my-auto">Nenhuma venda registrada.</p>
          ) : (
            <div className="space-y-4">
              {metrics.topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-xl hover:bg-zinc-800/50 transition-colors border border-transparent hover:border-zinc-700">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center font-black text-sm text-[#F1C40F]">
                      {index + 1}º
                    </div>
                    <div>
                      <p className="font-bold text-zinc-100 line-clamp-1">{product.name}</p>
                      <p className="text-xs text-zinc-400">{product.quantity} unid. vendidas</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-400">{formatCurrency(product.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
