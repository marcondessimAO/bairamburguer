"use client";

import type { OrderDTO } from "@/services/admin";

type PrintOrderButtonProps = {
  order: OrderDTO;
  className?: string;
};

const BRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const formatDateTime = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Não informado"
    : new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(date);
};

const orderStatusLabel = (status: string) => ({
  PENDING: "Pendente",
  PREPARING: "Em produção",
  DISPATCHED: "Saiu para entrega",
  DELIVERED: "Entregue",
}[status] ?? status ?? "Não informado");

const paymentStatusLabel = (status: string) => ({
  PAID: "Pago",
  AWAITING_PAYMENT: "A receber",
  PENDING: "A receber",
}[status] ?? status ?? "Não informado");

const paymentMethodLabel = (method?: string) => ({
  PIX: "Pix",
  DINHEIRO: "Dinheiro",
  CARTAO: "Cartão",
}[method ?? ""] ?? method ?? "Não informado");

const buildAddress = (order: OrderDTO) => {
  if (!order.neighborhood) return "Retirada na loja";
  const parts = [order.street, order.number && `nº ${order.number}`, order.complement]
    .filter(Boolean)
    .map(escapeHtml);
  return `${parts.join(", ")}<br />Bairro: ${escapeHtml(order.neighborhood.name)}`;
};

export const buildPrintableOrderHtml = (order: OrderDTO) => {
  const subtotal = order.items?.reduce((sum, item) => sum + Number(item.subtotal || 0), 0) ?? 0;
  const total = Number(order.totalAmount || 0);
  const deliveryFee = Number(order.deliveryFee ?? Math.max(total - subtotal, 0));
  const isManual = order.source === "MANUAL";
  const itemsHtml = (order.items ?? []).map((item) => `
    <tr>
      <td class="qty">${escapeHtml(item.quantity)}x</td>
      <td><strong>${escapeHtml(item.productNameSnapshot || item.product?.name || "Produto")}</strong>
        ${item.addonsSummary ? `<div class="addons">${escapeHtml(item.addonsSummary)}</div>` : ""}
      </td>
      <td class="price">${escapeHtml(BRL(Number(item.subtotal || 0)))}</td>
    </tr>`).join("");

  return `<!doctype html>
  <html lang="pt-BR"><head><meta charset="utf-8" /><title>Pedido #${escapeHtml(order.id)}</title>
  <style>
    @page { size: 80mm auto; margin: 4mm; }
    * { box-sizing: border-box; } body { margin:0; color:#000; background:#fff; font:13px/1.4 Arial,sans-serif; }
    main { width:100%; max-width:80mm; margin:auto; padding-bottom:20px; }
    header { text-align:center; margin-bottom:12px; } h1 { font-size:21px; margin:0; } header p { margin:2px; font-weight:bold; }
    .manual { border:3px solid #000; padding:5px; margin:8px 0; font-size:16px; font-weight:900; letter-spacing:1px; }
    .badge { display:inline-block; padding:4px 8px; color:#fff; background:#000; font-weight:bold; }
    .divider { border-top:2px dashed #000; margin:11px 0; } .title { font-weight:900; text-transform:uppercase; margin-bottom:6px; }
    .status { display:grid; grid-template-columns:1fr 1fr; gap:8px; background:#eee; padding:8px; margin:9px 0; }
    .status small { display:block; text-transform:uppercase; } .status strong { font-size:14px; }
    table { width:100%; border-collapse:collapse; } th { text-align:left; border-bottom:2px solid #000; } td { padding:7px 0; border-bottom:1px dashed #bbb; vertical-align:top; }
    .qty { width:30px; font-weight:bold; } .price { text-align:right; white-space:nowrap; font-weight:bold; } .addons { font-size:11px; font-style:italic; }
    .row { display:flex; justify-content:space-between; margin:4px 0; } .total { border-top:2px solid #000; padding-top:7px; font-size:18px; font-weight:900; }
    .note { border-left:4px solid #000; background:#eee; padding:8px; white-space:pre-wrap; font-weight:bold; }
    footer { text-align:center; font-size:11px; margin-top:18px; } @media print { body { print-color-adjust:exact; -webkit-print-color-adjust:exact; } }
  </style></head><body><main>
    <header><h1>BAIRAM BURGUER</h1><p>PEDIDO #${escapeHtml(order.id)}</p><p>${escapeHtml(formatDateTime(order.createdAt))}</p>
      ${isManual ? '<div class="manual">PEDIDO MANUAL</div>' : ""}
      <span class="badge">${order.neighborhood ? "ENTREGA" : "RETIRADA NA LOJA"}</span>
    </header>
    <div class="status"><div><small>Status do pedido</small><strong>${escapeHtml(orderStatusLabel(order.orderStatus))}</strong></div>
      <div><small>Pagamento</small><strong>${escapeHtml(paymentMethodLabel(order.paymentMethod))} — ${escapeHtml(paymentStatusLabel(order.paymentStatus))}</strong></div></div>
    <div class="divider"></div><div class="title">Cliente</div>
    <div><strong>Nome:</strong> ${escapeHtml(order.customerName || "Não informado")}</div>
    <div><strong>Telefone:</strong> ${escapeHtml(order.customerPhone || "Não informado")}</div>
    <div><strong>Atendimento:</strong> ${buildAddress(order)}</div>
    <div class="divider"></div><div class="title">Itens</div>
    <table><thead><tr><th>Qtd.</th><th>Item</th><th class="price">Total</th></tr></thead><tbody>${itemsHtml}</tbody></table>
    <div style="margin-top:12px"><div class="row"><span>Subtotal</span><span>${escapeHtml(BRL(subtotal))}</span></div>
      <div class="row"><span>Frete</span><span>${escapeHtml(BRL(deliveryFee))}</span></div>
      <div class="row total"><span>TOTAL</span><span>${escapeHtml(BRL(total))}</span></div></div>
    ${order.changeFor ? `<div class="row"><strong>Troco para</strong><strong>${escapeHtml(BRL(Number(order.changeFor)))}</strong></div>` : ""}
    ${order.observation ? `<div class="divider"></div><div class="title">Observação</div><div class="note">${escapeHtml(order.observation)}</div>` : ""}
    <div class="divider"></div><footer><strong>*** COMPROVANTE DE PEDIDO ***</strong><br />Este documento não possui valor fiscal.</footer>
  </main></body></html>`;
};

export function printOrder(order: OrderDTO, existingWindow?: Window | null) {
  const printWindow = existingWindow ?? window.open("", "_blank", "width=420,height=640");
  if (!printWindow) {
    window.alert("Não foi possível abrir a janela de impressão. Verifique o bloqueador de pop-ups.");
    return;
  }
  printWindow.document.open();
  printWindow.document.write(buildPrintableOrderHtml(order));
  printWindow.document.close();
  window.setTimeout(() => { printWindow.focus(); printWindow.print(); }, 150);
  printWindow.onafterprint = () => printWindow.close();
}

export function PrintOrderButton({ order, className = "" }: PrintOrderButtonProps) {
  return <button type="button" onClick={() => printOrder(order)}
    className={`w-full rounded-lg border border-gray-700 bg-black/30 py-2.5 text-sm font-bold text-gray-200 transition-colors hover:border-gray-500 hover:bg-black/50 ${className}`}>
    Imprimir pedido
  </button>;
}
