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
  const street = order.street ? escapeHtml(order.street) : "";
  const num = order.number ? escapeHtml(order.number) : "S/N";
  const comp = order.complement ? escapeHtml(order.complement) : "";
  const neigh = order.neighborhood?.name ? escapeHtml(order.neighborhood.name) : "";

  if (!street && !neigh) return "Não informado";

  let html = "";
  if (street) {
    html += `${street}, ${num}`;
  }
  if (comp) {
    html += `<br />Compl: ${comp}`;
  }
  if (neigh) {
    html += `<br />Bairro: ${neigh}`;
  }
  
  return html || "Não informado";
};

const getObservation = (order: OrderDTO) =>
  order.observation ?? order.notes ?? order.customerNote ?? order.orderNote ?? "";

const buildPrintableOrderHtml = (order: OrderDTO) => {
  const subtotal = order.items?.reduce((sum, item) => sum + Number(item.subtotal || 0), 0) ?? 0;
  const total = Number(order.totalAmount || 0);
  const deliveryFee = Math.max(total - subtotal, 0);
  const observation = getObservation(order);
  const isDelivery = !!(order.street || order.neighborhood?.name);

  const itemsHtml = (order.items ?? [])
    .map((item) => {
      const productName = item.product?.name || "Produto sem nome";
      const addons = item.addonsSummary
        ? `<div class="addons">${escapeHtml(item.addonsSummary)}</div>`
        : "";

      return `
        <tr>
          <td class="td-qty">${escapeHtml(item.quantity)}x</td>
          <td class="td-item">
            <strong>${escapeHtml(productName)}</strong>
            ${addons}
          </td>
          <td class="td-price">${escapeHtml(BRL(Number(item.subtotal || 0)))}</td>
        </tr>
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
          * { box-sizing: border-box; }
          body {
            margin: 0;
            background: #fff;
            color: #000;
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 13px;
            line-height: 1.4;
          }
          .receipt {
            width: 100%;
            max-width: 80mm;
            margin: 0 auto;
            padding-bottom: 20px;
          }
          .header {
            text-align: center;
            margin-bottom: 15px;
          }
          .header h1 {
            margin: 0 0 5px;
            font-size: 22px;
            font-weight: 900;
            text-transform: uppercase;
          }
          .header p {
            margin: 2px 0;
            font-size: 14px;
            font-weight: bold;
          }
          .divider {
            border-top: 2px dashed #000;
            margin: 12px 0;
          }
          .section-title {
            margin: 0 0 6px;
            font-weight: 800;
            font-size: 14px;
            text-transform: uppercase;
          }
          .row {
            display: flex;
            justify-content: space-between;
            margin: 4px 0;
          }
          .row-status {
            display: flex;
            justify-content: space-between;
            background: #f0f0f0;
            padding: 8px;
            border-radius: 4px;
            margin-bottom: 8px;
            font-weight: bold;
          }
          .row-status div {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }
          .row-status span:first-child {
            font-size: 11px;
            text-transform: uppercase;
            color: #444;
          }
          .row-status span:last-child {
            font-size: 14px;
            color: #000;
          }
          table.items {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
          }
          table.items th {
            text-align: left;
            border-bottom: 2px solid #000;
            padding-bottom: 4px;
            font-size: 12px;
          }
          table.items th.td-price {
            text-align: right;
          }
          table.items td {
            padding: 8px 0;
            border-bottom: 1px dashed #ccc;
            vertical-align: top;
          }
          .td-qty {
            width: 30px;
            font-weight: bold;
          }
          .td-item {
            padding-right: 10px;
          }
          .td-price {
            text-align: right;
            font-weight: bold;
            white-space: nowrap;
            width: 70px;
          }
          .addons {
            font-size: 11px;
            color: #333;
            margin-top: 4px;
            font-style: italic;
          }
          .totals {
            margin-top: 15px;
          }
          .total-row {
            font-size: 18px;
            font-weight: 900;
            margin-top: 8px;
            padding-top: 8px;
            border-top: 2px solid #000;
          }
          .info-block {
            margin-bottom: 8px;
          }
          .info-block strong {
            display: inline-block;
            min-width: 55px;
          }
          .delivery-badge {
            display: inline-block;
            background: #000;
            color: #fff;
            padding: 4px 8px;
            font-weight: bold;
            font-size: 14px;
            border-radius: 4px;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .observation {
            background: #f8f8f8;
            border-left: 4px solid #000;
            padding: 8px;
            font-weight: bold;
            font-size: 14px;
            white-space: pre-wrap;
          }
          .footer {
            text-align: center;
            font-size: 11px;
            color: #555;
            margin-top: 20px;
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
          <div class="header">
            <h1>BAIRAM BURGUER</h1>
            <p>PEDIDO #${escapeHtml(order.id)}</p>
            <p style="font-weight: normal;">${escapeHtml(formatDateTime(order.createdAt))}</p>
          </div>

          <div style="text-align: center;">
            <div class="delivery-badge">
              ${isDelivery ? '🚗 ENTREGA' : '🛍️ RETIRADA NA LOJA'}
            </div>
          </div>

          <div class="row-status">
            <div>
              <span>Status do Pedido</span>
              <span>${escapeHtml(statusLabel(order.orderStatus))}</span>
            </div>
            <div style="text-align: right;">
              <span>Status Financeiro</span>
              <span>${escapeHtml(paymentLabel(order.paymentStatus))}</span>
            </div>
          </div>

          <div class="divider"></div>

          <div class="section-title">Dados do Cliente</div>
          <div class="info-block">
            <strong>Nome:</strong> ${escapeHtml(order.customerName || "Não informado")}
          </div>
          <div class="info-block">
            <strong>Tel:</strong> ${escapeHtml(order.customerPhone || "Não informado")}
          </div>

          ${isDelivery ? `
          <div class="divider"></div>
          <div class="section-title">Endereço de Entrega</div>
          <div class="info-block" style="font-size: 14px; font-weight: bold;">
            ${buildAddress(order)}
          </div>
          ` : ''}

          <div class="divider"></div>

          <div class="section-title">Itens do Pedido</div>
          <table class="items">
            <thead>
              <tr>
                <th>QTD</th>
                <th>ITEM</th>
                <th class="td-price">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml || '<tr><td colspan="3">Nenhum item</td></tr>'}
            </tbody>
          </table>

          <div class="totals">
            <div class="row"><span>Subtotal</span><span>${escapeHtml(BRL(subtotal))}</span></div>
            <div class="row"><span>Taxa de Entrega</span><span>${escapeHtml(BRL(deliveryFee))}</span></div>
            <div class="row total-row"><span>TOTAL</span><span>${escapeHtml(BRL(total))}</span></div>
          </div>

          ${observation ? `
            <div class="divider"></div>
            <div class="section-title">Observações do Cliente</div>
            <div class="observation">${escapeHtml(observation)}</div>
          ` : ''}

          <div class="divider"></div>
          
          <div class="footer">
            <p><strong>*** COMPROVANTE DE PEDIDO ***</strong></p>
            <p>Este documento não possui valor fiscal.</p>
          </div>
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
