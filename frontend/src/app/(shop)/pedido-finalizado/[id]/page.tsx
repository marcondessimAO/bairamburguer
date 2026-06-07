"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type OrderItem = {
  id: number;
  quantity: number;
  subtotal: number;
  addonsSummary?: string;
  addonsTotal?: number;
  product: {
    name: string;
    price: number;
  };
};

type Order = {
  id: number;
  customerName?: string;
  customerPhone?: string;
  street?: string;
  number?: string;
  complement?: string;
  totalAmount: number;
  paymentStatus: string;
  orderStatus: string;
  neighborhood?: {
    name: string;
    deliveryFee: number;
  } | null;
  items?: OrderItem[];
};

const BRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const paymentLabel = (status: string) => {
  if (status === "PAID") return "Pagamento aprovado";
  if (status === "WHATSAPP") return "Confirmacao via WhatsApp";
  if (status === "AWAITING_PAYMENT") return "Aguardando pagamento";
  return status || "Nao informado";
};

const orderLabel = (status: string) => {
  if (status === "PENDING") return "Pedido recebido";
  if (status === "PREPARING") return "Em producao";
  if (status === "DISPATCHED") return "Saiu para entrega";
  if (status === "DELIVERED") return "Entregue";
  return status || "Nao informado";
};

export default function FinishedOrderPage() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const loadOrder = async () => {
      try {
        const response = await fetch(`/api/orders/${params.id}`);
        if (!response.ok) throw new Error("Nao foi possivel carregar o pedido.");
        const data: Order = await response.json();
        if (cancelled) return;
        setOrder(data);
        setError("");
        setLoading(false);

        if (data.paymentStatus === "PAID" && intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
      } catch {
        if (!cancelled) {
          setError("Nao conseguimos carregar os dados do pedido agora.");
          setLoading(false);
        }
      }
    };

    loadOrder();
    intervalId = setInterval(loadOrder, 3000);

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [params.id]);

  const subtotal = useMemo(
    () => order?.items?.reduce((sum, item) => sum + Number(item.subtotal || 0), 0) ?? 0,
    [order]
  );
  const total = Number(order?.totalAmount ?? 0);
  const deliveryFee = Math.max(total - subtotal, 0);
  const address = order
    ? [order.street, order.number, order.complement].filter(Boolean).join(", ")
    : "";

  const handleWhatsApp = () => {
    if (!order) return;
    const lojaWhatsApp = "558399327186";
    let message = `Novo Pedido - Bairamburguer!\n`;
    message += `Pedido: #${order.id}\n`;
    if (order.customerName) message += `Nome: ${order.customerName}\n`;
    if (order.customerPhone) message += `WhatsApp: ${order.customerPhone}\n`;
    message += `Pagamento: ${paymentLabel(order.paymentStatus)}\n`;
    message += `Status: ${orderLabel(order.orderStatus)}\n\n`;
    message += `Itens:\n`;
    order.items?.forEach((item) => {
      message += `- ${item.quantity}x ${item.product.name}\n`;
      if (item.addonsSummary) message += `  Complementos: ${item.addonsSummary}\n`;
    });
    message += `\nSubtotal: ${BRL(subtotal)}\n`;
    message += `Frete: ${BRL(deliveryFee)}\n`;
    message += `Total: ${BRL(total)}\n`;
    if (address || order.neighborhood?.name) {
      message += `Endereco: ${[address, order.neighborhood?.name].filter(Boolean).join(" - ")}\n`;
    } else {
      message += `Modalidade: Retirada na loja\n`;
    }

    window.open(`https://wa.me/${lojaWhatsApp}?text=${encodeURIComponent(message)}`, "_blank");
  };

  return (
    <main className="min-h-screen bg-[#121212] px-4 py-6 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-48px)] w-full max-w-2xl flex-col">
        <header className="mb-6 flex items-center justify-between">
          <Image
            src="/images/bairam-logo.jpg.jpg"
            alt="Bairamburguer"
            width={96}
            height={48}
            className="h-12 w-auto rounded-lg"
            priority
          />
          <Link href="/" className="rounded-lg border border-gray-700 px-3 py-2 text-sm font-bold text-gray-300">
            Cardapio
          </Link>
        </header>

        <section className="flex-1 rounded-2xl border border-gray-800 bg-[#1A1A1A] p-5 shadow-xl">
          {loading ? (
            <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
              <div className="mb-5 h-12 w-12 animate-spin rounded-full border-4 border-[#F1C40F] border-t-transparent" />
              <p className="text-gray-300">Carregando seu pedido...</p>
            </div>
          ) : error ? (
            <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
              <h1 className="mb-3 text-2xl font-black">Ops, algo saiu do ponto</h1>
              <p className="mb-6 text-gray-400">{error}</p>
              <Link href="/" className="rounded-xl bg-[#F1C40F] px-5 py-3 font-black text-[#121212]">
                Voltar ao cardapio
              </Link>
            </div>
          ) : order ? (
            <div className="space-y-6">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border-4 border-[#25D366]/30 bg-[#25D366]/20 text-[#25D366]">
                  <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-sm font-bold uppercase tracking-wide text-[#F1C40F]">Pedido #{order.id}</p>
                <h1 className="mt-2 text-3xl font-black">Pagamento aprovado!</h1>
                <p className="mt-2 text-gray-400">
                  Seu pedido foi recebido pela loja e ja entrou na fila da cozinha.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-black/25 p-4">
                  <p className="text-xs font-bold uppercase text-gray-500">Pagamento</p>
                  <p className="mt-1 font-black text-[#25D366]">{paymentLabel(order.paymentStatus)}</p>
                </div>
                <div className="rounded-xl bg-black/25 p-4">
                  <p className="text-xs font-bold uppercase text-gray-500">Status do pedido</p>
                  <p className="mt-1 font-black text-[#F1C40F]">{orderLabel(order.orderStatus)}</p>
                </div>
              </div>

              <div className="rounded-xl bg-black/25 p-4">
                <h2 className="mb-3 font-black">Resumo</h2>
                <ul className="space-y-2 text-sm text-gray-300">
                  {order.items?.map((item) => (
                    <li key={item.id} className="flex flex-wrap justify-between gap-2">
                      <span>{item.quantity}x {item.product.name}</span>
                      <span className="font-bold text-white">{BRL(Number(item.subtotal))}</span>
                      {item.addonsSummary && (
                        <span className="w-full text-xs text-gray-400">{item.addonsSummary}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl bg-black/25 p-4 text-sm text-gray-300">
                <h2 className="mb-2 font-black text-white">Entrega</h2>
                {address || order.neighborhood?.name ? (
                  <p>{[address, order.neighborhood?.name].filter(Boolean).join(" - ")}</p>
                ) : (
                  <p>Retirada na loja</p>
                )}
              </div>

              <div className="space-y-2 rounded-xl bg-black/25 p-4 text-sm">
                <div className="flex justify-between text-gray-400">
                  <span>Valor do pedido</span>
                  <span className="font-bold text-white">{BRL(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Frete</span>
                  <span className="font-bold text-white">{BRL(deliveryFee)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-700 pt-3 text-lg">
                  <span className="font-black">Total</span>
                  <span className="font-black text-[#F1C40F]">{BRL(total)}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  onClick={handleWhatsApp}
                  className="rounded-xl bg-[#25D366] px-4 py-4 font-black text-white transition-colors hover:bg-[#1ebe59]"
                >
                  Avisar loja no WhatsApp
                </button>
                <Link
                  href="/"
                  className="rounded-xl bg-[#F1C40F] px-4 py-4 text-center font-black text-[#121212] transition-colors hover:bg-[#D4AC0D]"
                >
                  Voltar ao cardapio
                </Link>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
