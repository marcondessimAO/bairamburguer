"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchWithAuth } from "@/services/api";
import { adminService } from "@/services/admin";
import {
  ArrowDownRight, ArrowUpRight, ChefHat, Clock3, DollarSign, LayoutDashboard,
  MenuSquare, PackagePlus, Receipt, RefreshCw, ShoppingBag, Store, Trophy, Layers
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type DateRange = { start: string; end: string };
type Preset = "today" | "yesterday" | "last7" | "last30" | "month" | "custom";
type RankingTab = "mostSold" | "highestRevenue" | "leastSold";

type Change = { percentage: number | null; direction: "up" | "down" | "neutral"; previousValueWasZero: boolean };
type Product = { name: string; quantity: number; revenue: number; revenueShare: number };
type Metrics = {
  period: DateRange;
  summary: { revenue: number; paidOrders: number; averageTicket: number };
  comparison: { revenue: Change; paidOrders: Change; averageTicket: Change };
  ordersByStatus: { status: string; label: string; count: number; requiresAttention: boolean }[];
  averagePreparationTime: { minutes: number | null; sampleSize: number };
  salesEvolution: { timestamp: string; revenue: number; orders: number }[];
  topProducts: Record<RankingTab, Product[]>;
};
type StoreStatus = { isOpen: boolean; updatedAt?: string | null };

const formatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const presets: { id: Preset; label: string }[] = [
  { id: "today", label: "Hoje" }, { id: "yesterday", label: "Ontem" },
  { id: "last7", label: "Últimos 7 dias" }, { id: "last30", label: "Últimos 30 dias" },
  { id: "month", label: "Mês atual" }, { id: "custom", label: "Personalizado" }
];

function localIso(date: Date) {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

function getRange(preset: Exclude<Preset, "custom">): DateRange {
  const end = new Date();
  const start = new Date(end);
  if (preset === "yesterday") {
    start.setDate(start.getDate() - 1);
    end.setDate(end.getDate() - 1);
  }
  if (preset === "last7") start.setDate(start.getDate() - 6);
  if (preset === "last30") start.setDate(start.getDate() - 29);
  if (preset === "month") start.setDate(1);
  return { start: localIso(start), end: localIso(end) };
}

function dateLabel(value: string, hourly: boolean) {
  if (hourly) return `${value.slice(11, 13)}h`;
  const [, month, day] = value.slice(0, 10).split("-");
  return `${day}/${month}`;
}

function statusStyle(status: string) {
  return {
    PENDING: "border-zinc-700 bg-zinc-800/70 text-zinc-200",
    PREPARING: "border-blue-400/30 bg-blue-500/10 text-blue-300",
    DISPATCHED: "border-amber-400/30 bg-amber-400/10 text-amber-200",
    DELIVERED: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
    CANCELED: "border-red-400/30 bg-red-400/10 text-red-300"
  }[status] ?? "border-zinc-700 bg-zinc-800 text-zinc-300";
}

function Skeleton() {
  return <div className="space-y-6 animate-pulse"><div className="h-12 w-72 rounded-xl bg-zinc-800" /><div className="grid gap-4 md:grid-cols-3">{[1, 2, 3].map(i => <div className="h-36 rounded-2xl bg-zinc-800" key={i} />)}</div><div className="h-80 rounded-2xl bg-zinc-800" /></div>;
}

function Comparison({ change }: { change: Change }) {
  if (change.previousValueWasZero) return <p className="mt-1 text-xs text-zinc-500">Sem base no período anterior</p>;
  const positive = change.direction === "up";
  const neutral = change.direction === "neutral";
  return <p className={`mt-1 flex items-center gap-1 text-xs font-semibold ${neutral ? "text-zinc-400" : positive ? "text-emerald-400" : "text-red-400"}`}>
    {!neutral && (positive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />)}
    {neutral ? "0%" : `${Math.abs(change.percentage ?? 0).toLocaleString("pt-BR")}%`} <span className="font-normal text-zinc-500">vs. período anterior</span>
  </p>;
}

export default function DashboardPage() {
  const [preset, setPreset] = useState<Preset>("month");
  const [range, setRange] = useState<DateRange>(() => getRange("month"));
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [rankingTab, setRankingTab] = useState<RankingTab>("mostSold");
  const [chartMode, setChartMode] = useState<"revenue" | "orders">("revenue");
  const [storeStatus, setStoreStatus] = useState<StoreStatus | null>(null);
  const [storeLoading, setStoreLoading] = useState(false);
  const [storeError, setStoreError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    adminService.getStoreStatus().then(setStoreStatus).catch(() => setStoreError("Não foi possível carregar o estado da loja."));
  }, []);

  const loadMetrics = useCallback(async (silent = false) => {
    if (range.end < range.start) { setError("A data final deve ser igual ou posterior à data inicial."); setLoading(false); return; }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    if (silent) setRefreshing(true); else setLoading(true);
    try {
      const params = new URLSearchParams({ startDate: range.start, endDate: range.end });
      const response = await fetchWithAuth(`/v1/admin/dashboard/metrics?${params}`, { signal: controller.signal });
      if (!response.ok) {
        const responseBody = await response.text();
        if (process.env.NODE_ENV === "development") {
          console.error("Falha ao carregar métricas do Dashboard", {
            status: response.status,
            statusText: response.statusText,
            endpoint: response.url,
            responseBody,
          });
        }
        throw new Error(response.status === 401 || response.status === 403
          ? "Seu acesso administrativo expirou."
          : "Não foi possível atualizar o Dashboard.");
      }
      setMetrics(await response.json());
      setError(null);
      setLastUpdated(new Date());
    } catch (requestError) {
      if ((requestError as DOMException).name !== "AbortError") setError(requestError instanceof Error ? requestError.message : "Não foi possível atualizar o Dashboard.");
    } finally {
      if (!controller.signal.aborted) { setLoading(false); setRefreshing(false); }
    }
  }, [range]);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void loadMetrics(), 0);
    const poll = window.setInterval(() => void loadMetrics(true), 60_000);
    return () => { window.clearTimeout(initialLoad); window.clearInterval(poll); abortRef.current?.abort(); };
  }, [loadMetrics]);

  const selectPreset = (next: Preset) => {
    setPreset(next);
    if (next !== "custom") setRange(getRange(next));
  };

  const toggleStore = async () => {
    if (!storeStatus || storeLoading) return;
    const previous = storeStatus;
    setStoreStatus({ ...previous, isOpen: !previous.isOpen });
    setStoreLoading(true); setStoreError(null);
    try { setStoreStatus(await adminService.toggleStoreStatus()); }
    catch { setStoreStatus(previous); setStoreError("Não foi possível alterar a loja. Tente novamente."); }
    finally { setStoreLoading(false); }
  };

  const chartData = useMemo(() => metrics?.salesEvolution.map(point => ({
    ...point, label: dateLabel(point.timestamp, metrics.salesEvolution.length <= 24)
  })) ?? [], [metrics]);
  const activeProducts = metrics?.topProducts[rankingTab] ?? [];
  const summaryCards: { label: string; value: string; change: Change; Icon: LucideIcon; color: string }[] = metrics ? [
    { label: "Faturamento", value: formatter.format(metrics.summary.revenue), change: metrics.comparison.revenue, Icon: DollarSign, color: "text-emerald-400" },
    { label: "Pedidos pagos", value: String(metrics.summary.paidOrders), change: metrics.comparison.paidOrders, Icon: ShoppingBag, color: "text-blue-400" },
    { label: "Ticket médio", value: formatter.format(metrics.summary.averageTicket), change: metrics.comparison.averageTicket, Icon: Receipt, color: "text-violet-400" }
  ] : [];

  if (loading && !metrics) return <Skeleton />;

  return <div className="space-y-6 pb-12">
    <header className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
      <div><h1 className="text-3xl font-black tracking-tight text-zinc-100">Dashboard</h1><p className="mt-1 text-zinc-400">Visão consolidada da operação e das vendas.</p></div>
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-zinc-800 bg-[#1E1E1E] p-2">
        <select aria-label="Selecionar período" value={preset} onChange={event => selectPreset(event.target.value as Preset)} className="rounded-xl border border-zinc-700 bg-[#121212] px-3 py-2 text-sm font-medium text-zinc-200 outline-none focus:border-[#F1C40F]">
          {presets.map(option => <option value={option.id} key={option.id}>{option.label}</option>)}
        </select>
        {preset === "custom" && <><input aria-label="Data inicial" type="date" value={range.start} onChange={event => setRange(current => ({ ...current, start: event.target.value }))} className="rounded-xl border border-zinc-700 bg-[#121212] px-2 py-2 text-sm text-zinc-200" /><input aria-label="Data final" type="date" value={range.end} onChange={event => setRange(current => ({ ...current, end: event.target.value }))} className="rounded-xl border border-zinc-700 bg-[#121212] px-2 py-2 text-sm text-zinc-200" /></>}
        <button onClick={() => void loadMetrics(true)} disabled={refreshing} title="Atualizar agora" className="rounded-xl p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-[#F1C40F] disabled:cursor-not-allowed disabled:opacity-50"><RefreshCw className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`} /><span className="sr-only">Atualizar agora</span></button>
      </div>
    </header>

    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500"><span>Período: {range.start.split("-").reverse().join("/")} a {range.end.split("-").reverse().join("/")}</span>{lastUpdated && <span>Última atualização: {lastUpdated.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>}{refreshing && <span className="text-[#F1C40F]">Atualizando…</span>}</div>
    {error && <div role="alert" className="flex items-center justify-between gap-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200"><span>{error}</span><button onClick={() => void loadMetrics(true)} className="font-bold underline">Tentar novamente</button></div>}

    {metrics && <>
      <section className="grid gap-4 md:grid-cols-3">
        {summaryCards.map(({ label, value, change, Icon, color }) => <article key={label} className="rounded-2xl border border-zinc-800 bg-[#1E1E1E] p-5 shadow-lg"><div className="flex items-center gap-3"><div className="rounded-xl border border-zinc-700 bg-zinc-800/70 p-3"><Icon className={`h-6 w-6 ${color}`} /></div><div><p className="text-sm text-zinc-400">{label}</p><p className="mt-1 text-2xl font-black text-zinc-100">{value}</p></div></div><Comparison change={change} /></article>)}
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-[#1E1E1E] p-5 shadow-lg"><div className="mb-4 flex items-center gap-2"><LayoutDashboard className="h-5 w-5 text-[#F1C40F]" /><h2 className="text-lg font-bold text-zinc-100">Pedidos por status</h2></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{metrics.ordersByStatus.map(status => <Link href="/admin" key={status.status} className={`rounded-xl border p-4 transition hover:-translate-y-0.5 ${statusStyle(status.status)} ${status.requiresAttention ? "ring-1 ring-current/20" : ""}`}><p className="text-xs font-semibold uppercase tracking-wide opacity-80">{status.label}</p><p className="mt-2 text-3xl font-black">{status.count}</p>{status.requiresAttention && <p className="mt-1 text-xs">Requer atenção</p>}</Link>)}</div></section>

      <section className="grid gap-6 xl:grid-cols-3">
        <article className="xl:col-span-2 rounded-2xl border border-zinc-800 bg-[#1E1E1E] p-5 shadow-lg"><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-bold text-zinc-100">Evolução de Vendas</h2><p className="text-sm text-zinc-500">Dias sem vendas são exibidos como zero.</p></div><div className="rounded-xl bg-zinc-800 p-1"><button onClick={() => setChartMode("revenue")} className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${chartMode === "revenue" ? "bg-[#F1C40F] text-black" : "text-zinc-400"}`}>Faturamento</button><button onClick={() => setChartMode("orders")} className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${chartMode === "orders" ? "bg-[#F1C40F] text-black" : "text-zinc-400"}`}>Pedidos</button></div></div><div className="h-[310px]"><ResponsiveContainer width="100%" height="100%"><LineChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}><CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} /><XAxis dataKey="label" minTickGap={20} stroke="#71717a" tick={{ fill: "#a1a1aa", fontSize: 12 }} tickLine={false} axisLine={false} /><YAxis width={chartMode === "revenue" ? 72 : 36} stroke="#71717a" tick={{ fill: "#a1a1aa", fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={value => chartMode === "revenue" ? `R$ ${Number(value).toLocaleString("pt-BR")}` : value} /><Tooltip contentStyle={{ background: "#121212", border: "1px solid #3f3f46", borderRadius: 12 }} labelStyle={{ color: "#d4d4d8" }} formatter={(value) => [chartMode === "revenue" ? formatter.format(Number(value)) : `${value} pedido(s)`, chartMode === "revenue" ? "Faturamento" : "Pedidos"]} labelFormatter={(_, payload) => payload[0]?.payload?.timestamp ? dateLabel(String(payload[0].payload.timestamp), chartData.length <= 24) : ""} /><Line type="monotone" dataKey={chartMode} stroke="#F1C40F" strokeWidth={3} dot={false} activeDot={{ r: 5, fill: "#F1C40F" }} /></LineChart></ResponsiveContainer></div></article>
        <article className="rounded-2xl border border-zinc-800 bg-[#1E1E1E] p-5 shadow-lg"><div className="mb-5 flex items-center gap-2"><Clock3 className="h-5 w-5 text-[#F1C40F]" /><div><h2 className="text-lg font-bold text-zinc-100">Tempo médio de preparo</h2><p className="text-xs text-zinc-500">Da produção ao despacho</p></div></div>{metrics.averagePreparationTime.minutes === null ? <p className="py-8 text-center text-zinc-500">Sem dados de preparo no período.</p> : <><p className="text-4xl font-black text-zinc-100">{Number(metrics.averagePreparationTime.minutes).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}<span className="ml-1 text-lg text-zinc-400">min</span></p><p className="mt-3 text-sm text-zinc-500">Baseado em {metrics.averagePreparationTime.sampleSize} pedido(s) com transições registradas.</p></>}</article>
      </section>

      <section className="grid gap-6 xl:grid-cols-3"><article className="xl:col-span-2 rounded-2xl border border-zinc-800 bg-[#1E1E1E] p-5 shadow-lg"><div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-2"><Trophy className="h-5 w-5 text-[#F1C40F]" /><h2 className="text-xl font-bold text-zinc-100">Produtos</h2></div><div className="flex flex-wrap gap-1 rounded-xl bg-zinc-800 p-1">{(["mostSold", "highestRevenue", "leastSold"] as RankingTab[]).map(tab => <button key={tab} onClick={() => setRankingTab(tab)} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${rankingTab === tab ? "bg-[#F1C40F] text-black" : "text-zinc-400"}`}>{({ mostSold: "Mais vendidos", highestRevenue: "Maior faturamento", leastSold: "Menos vendidos" })[tab]}</button>)}</div></div>{activeProducts.length === 0 ? <p className="py-12 text-center text-zinc-500">Nenhuma venda válida no período.</p> : <div className="space-y-2">{activeProducts.map((product, index) => <div key={`${product.name}-${index}`} className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800 p-3"><div className="flex min-w-0 items-center gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-sm font-black text-[#F1C40F]">{index + 1}º</span><div className="min-w-0"><p className="truncate font-bold text-zinc-100">{product.name}</p><p className="text-xs text-zinc-500">{product.quantity} unid. · {Number(product.revenueShare).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% do faturamento</p></div></div><p className="shrink-0 font-bold text-emerald-400">{formatter.format(product.revenue)}</p></div>)}</div>}</article>
        <article className="rounded-2xl border border-zinc-800 bg-[#1E1E1E] p-5 shadow-lg"><div className="mb-4 flex items-center gap-2"><ChefHat className="h-5 w-5 text-[#F1C40F]" /><h2 className="text-lg font-bold text-zinc-100">Atalhos rápidos</h2></div><div className="grid gap-2">{[["/admin", "Ver Kanban da Cozinha", LayoutDashboard], ["/admin/menu", "Gerir Cardápio", MenuSquare], ["/admin/menu?create=true", "Novo Produto", PackagePlus], ["/admin/addons", "Gerir Adicionais", Layers]].map(([href, label, Icon]) => { const ShortcutIcon = Icon as typeof LayoutDashboard; return <Link href={href as string} key={label as string} className="flex items-center gap-3 rounded-xl border border-zinc-800 p-3 text-sm font-semibold text-zinc-300 transition hover:border-[#F1C40F]/50 hover:bg-zinc-800"><ShortcutIcon className="h-4 w-4 text-[#F1C40F]" />{label as string}</Link>; })}<button onClick={() => void toggleStore()} disabled={!storeStatus || storeLoading} className={`flex items-center gap-3 rounded-xl border p-3 text-left text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${storeStatus?.isOpen ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" : "border-red-400/30 bg-red-400/10 text-red-200"}`}><Store className="h-4 w-4" />{storeLoading ? "Alterando loja…" : storeStatus?.isOpen ? "Fechar Loja" : "Abrir Loja"}</button>{storeStatus?.updatedAt && <p className="text-xs text-zinc-500">Última alteração: {new Date(storeStatus.updatedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>}{storeError && <p role="alert" className="text-xs text-red-400">{storeError}</p>}</div></article></section>
    </>}
  </div>;
}
