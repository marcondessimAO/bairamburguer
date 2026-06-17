"use client";

import type { OrderDTO } from "@/services/admin";

type PrintOrderButtonProps = {
  order: OrderDTO;
  className?: string;
};

const BRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const statusLabel = (status: string) => {
  const labels: Record<string, string> = {
    PENDING: "Pendente",
    PREPARING: "Em produção",
    DISPATCHED: "Saiu para entrega",
    DELIVERED: "Entregue",
  };

  return labels[status] ?? status ?? "Não informado";
};

const paymentLabel = (status: string) => {
  const labels: Record<string, string> = {
    PAID: "Pago",
    AWAITING_PAYMENT: "Aguardando pagamento",
    WHATSAPP: "WhatsApp",
    PENDING: "Pendente",
  };

  return labels[status] ?? status ?? "Não informado";
};

const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Não informado";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
};

const buildAddress = (order: OrderDTO) => {
  const streetLine = [order.street, order.number].filter(Boolean).map(escapeHtml).join(", ");
  const neighborhoodLine = [order.neighborhood?.name, order.complement].filter(Boolean).map(escapeHtml).join(" - ");
  return [streetLine, neighborhoodLine].filter(Boolean).join("<br />") || "Não informado";
};

const getObservation = (order: OrderDTO) =>
  order.observation ?? order.notes ?? order.customerNote ?? order.orderNote ?? "";

const buildPrintableOrderHtml = (order: OrderDTO) => {
  const subtotal = order.items?.reduce((sum, item) => sum + Number(item.subtotal || 0), 0) ?? 0;
  const total = Number(order.totalAmount || 0);
  const deliveryFee = Math.max(total - subtotal, 0);
  const observation = getObservation(order);

  const itemsHtml = (order.items ?? [])
    .map((item) => {
      const productName = item.product?.name || "Produto sem nome";
      const addons = item.addonsSummary
        ? `<div class="addons">${escapeHtml(item.addonsSummary)}</div>`
        : "";

      return `
        <div class="item">
          <div class="item-main">${escapeHtml(item.quantity)} x ${escapeHtml(productName)}</div>
          ${addons}
        </div>
      `;
    })
    .join("");

  return `
    <!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <title>Pedido #${escapeHtml(order.id)}</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 4mm;
          }

          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            background: #fff;
            color: #000;
            font-family: Arial, Helvetica, sans-serif;
            font-size: 12px;
            line-height: 1.35;
          }

          .receipt {
            width: 100%;
            max-width: 80mm;
            margin: 0 auto;
          }

          h1 {
            margin: 0 0 8px;
            text-align: center;
            font-size: 18px;
            font-weight: 800;
            letter-spacing: 0.02em;
          }

          .line {
            border-top: 1px dashed #000;
            margin: 10px 0;
          }

          .row {
            display: flex;
            justify-content: space-between;
            gap: 12px;
            margin: 3px 0;
          }

          .label {
            font-weight: 700;
          }

          .section-title {
            margin: 0 0 5px;
            font-weight: 800;
            text-transform: uppercase;
          }

          .item {
            margin: 0 0 8px;
            break-inside: avoid;
          }

          .item-main {
            font-weight: 700;
          }

          .addons {
            margin-top: 2px;
            padding-left: 10px;
            font-size: 11px;
          }

          .total {
            font-size: 14px;
            font-weight: 800;
          }

          .observation {
            white-space: pre-wrap;
          }

          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        <main class="receipt">
          <h1>BAIRAM BURGUER</h1>

          <div class="row"><span class="label">Pedido:</span><span>#${escapeHtml(order.id)}</span></div>
          <div class="row"><span class="label">Data/Hora:</span><span>${escapeHtml(formatDateTime(order.createdAt))}</span></div>
          <div class="row"><span class="label">Status:</span><span>${escapeHtml(statusLabel(order.orderStatus))}</span></div>
          <div class="row"><span class="label">Pagamento:</span><span>${escapeHtml(paymentLabel(order.paymentStatus))}</span></div>

          <div class="line"></div>

          <p class="section-title">Cliente</p>
          <div>${escapeHtml(order.customerName || "Não informado")}</div>
          <div>${escapeHtml(order.customerPhone || "Telefone não informado")}</div>

          <div class="line"></div>

          <p class="section-title">Endereço</p>
          <div>${buildAddress(order)}</div>

          <div class="line"></div>

          <p class="section-title">Itens</p>
          ${itemsHtml || "<div>Nenhum item informado</div>"}

          <div class="line"></div>

          <div class="row"><span>Subtotal:</span><span>${escapeHtml(BRL(subtotal))}</span></div>
          <div class="row"><span>Frete:</span><span>${escapeHtml(BRL(deliveryFee))}</span></div>
          <div class="row total"><span>Total:</span><span>${escapeHtml(BRL(total))}</span></div>

          ${
            observation
              ? `
                <div class="line"></div>
                <p class="section-title">Observação</p>
                <div class="observation">${escapeHtml(observation)}</div>
              `
              : ""
          }
        </main>
      </body>
    </html>
  `;
};

export function PrintOrderButton({ order, className = "" }: PrintOrderButtonProps) {
  const handlePrint = () => {
    const printWindow = window.open("", "_blank", "width=420,height=640");

    if (!printWindow) {
      window.alert("Não foi possível abrir a janela de impressão. Verifique o bloqueador de pop-ups.");
      return;
    }

    printWindow.document.open();
    printWindow.document.write(buildPrintableOrderHtml(order));
    printWindow.document.close();

    window.setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 150);

    printWindow.onafterprint = () => {
      printWindow.close();
    };
  };

  return (
    <button
      type="button"
      onClick={handlePrint}
      className={`w-full rounded-lg border border-gray-700 bg-black/30 py-2.5 text-sm font-bold text-gray-200 transition-colors hover:border-gray-500 hover:bg-black/50 ${className}`}
    >
      Imprimir pedido
    </button>
  );
}
