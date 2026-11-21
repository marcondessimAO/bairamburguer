"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { adminService, ManualOrderPayload, OrderDTO, ProductDTO } from "@/services/admin";
import { printOrder } from "@/components/ui/PrintOrderButton";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: (order: OrderDTO) => void;
};

type Line = { key: number; productId: number | null; quantity: number; addonIds: number[] };
type NeighborhoodOption = { id: number; name: string; deliveryFee: number };

const BRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export function ManualOrderModal({ open, onClose, onCreated }: Props) {
  const nextKey = useRef(2);
  const [products, setProducts] = useState<ProductDTO[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<NeighborhoodOption[]>([]);
  const [lines, setLines] = useState<Line[]>([{ key: 1, productId: null, quantity: 1, addonIds: [] }]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryMode, setDeliveryMode] = useState<"ENTREGA" | "RETIRADA">("RETIRADA");
  const [neighborhoodName, setNeighborhoodName] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [observation, setObservation] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"DINHEIRO" | "CARTAO">("DINHEIRO");
  const [changeFor, setChangeFor] = useState("");
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    let active = true;
    Promise.all([adminService.getProducts(), adminService.getManualOrderOptions()])
      .then(([productData, options]) => {
        if (!active) return;
        setProducts(productData.filter((product) => product.isAvailable));
        setNeighborhoods(options.neighborhoods);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Não foi possível carregar o cardápio.");
      })
      .finally(() => { if (active) setLoadingOptions(false); });
    return () => { active = false; };
  }, [open]);

  const subtotal = useMemo(() => lines.reduce((sum, line) => {
    const product = products.find((entry) => entry.id === line.productId);
    if (!product) return sum;
    const addons = (product.addons ?? [])
      .filter((addon) => line.addonIds.includes(addon.id))
      .reduce((addonSum, addon) => addonSum + Number(addon.price), 0);
    return sum + (Number(product.price) + addons) * line.quantity;
  }, 0), [lines, products]);
  const deliveryFee = 0;

  if (!open) return null;

  const updateLine = (key: number, patch: Partial<Line>) =>
    setLines((current) => current.map((line) => line.key === key ? { ...line, ...patch } : line));

  const selectAddon = (line: Line, product: ProductDTO, addonId: number) => {
    const addon = product.addons?.find((entry) => entry.id === addonId);
    if (!addon) return;
    if (line.addonIds.includes(addonId)) {
      updateLine(line.key, { addonIds: line.addonIds.filter((id) => id !== addonId) });
      return;
    }
    const withoutSameSingleGroup = addon.selectionType === "SINGLE"
      ? line.addonIds.filter((id) => product.addons?.find((entry) => entry.id === id)?.groupName !== addon.groupName)
      : line.addonIds;
    updateLine(line.key, { addonIds: [...withoutSameSingleGroup, addonId] });
  };

  const reset = () => {
    setLines([{ key: nextKey.current++, productId: null, quantity: 1, addonIds: [] }]);
    setCustomerName(""); setCustomerPhone(""); setDeliveryMode("RETIRADA");
    setNeighborhoodName(""); setStreet(""); setNumber(""); setComplement("");
    setObservation(""); setPaymentMethod("DINHEIRO"); setChangeFor(""); setError("");
  };

  const close = () => { if (!submitting) { reset(); onClose(); } };

  const submit = async (printAfter: boolean) => {
    if (submitting) return;
    setError("");
    const selectedLines = lines.filter((line) => line.productId !== null);
    if (!selectedLines.length) { setError("Adicione ao menos um produto ao pedido."); return; }
    const parsedChangeFor = changeFor ? Number(changeFor.replace(",", ".")) : undefined;
    if (paymentMethod === "DINHEIRO" && parsedChangeFor !== undefined && (!Number.isFinite(parsedChangeFor) || parsedChangeFor <= 0)) {
      setError("Informe um valor válido para troco.");
      return;
    }

    const popup = printAfter ? window.open("", "_blank", "width=420,height=640") : null;
    if (popup) popup.document.write("<p style='font-family:Arial;padding:24px'>Criando pedido...</p>");
    setSubmitting(true);
    try {
      const payload: ManualOrderPayload = {
        customerName,
        customerPhone,
        deliveryMode,
        paymentMethod,
        observation: observation || undefined,
        changeFor: paymentMethod === "DINHEIRO" ? parsedChangeFor : undefined,
        items: selectedLines.map((line) => ({ product: line.productId!, quantity: line.quantity, addonIds: line.addonIds })),
        ...(deliveryMode === "ENTREGA" ? { neighborhoodName, street, number, complement: complement || undefined } : {}),
      };
      const order = await adminService.createManualOrder(payload);
      onCreated(order);
      if (printAfter) printOrder(order, popup);
      reset();
      onClose();
    } catch (reason) {
      popup?.close();
      setError(reason instanceof Error ? reason.message : "Não foi possível criar o pedido.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (event: FormEvent) => { event.preventDefault(); void submit(false); };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/80 p-0 backdrop-blur-sm sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-labelledby="manual-order-title">
      <form onSubmit={handleSubmit} className="flex max-h-[96vh] w-full max-w-5xl flex-col overflow-hidden rounded-t-2xl border border-gray-700 bg-[#151515] shadow-2xl sm:rounded-2xl">
        <header className="flex items-center justify-between border-b border-gray-800 px-4 py-4 sm:px-6">
          <div><p className="text-xs font-black uppercase tracking-[0.2em] text-[#F1C40F]">Atendimento administrativo</p><h2 id="manual-order-title" className="text-xl font-black">Novo Pedido Manual</h2></div>
          <button type="button" onClick={close} disabled={submitting} className="rounded-lg border border-gray-700 px-3 py-2 text-sm font-bold text-gray-300 hover:bg-gray-800">Fechar</button>
        </header>

        <div className="grid flex-1 gap-6 overflow-y-auto p-4 sm:p-6 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="space-y-6">
            <section className="grid gap-3 rounded-xl border border-gray-800 bg-black/20 p-4 sm:grid-cols-2">
              <label className="text-sm font-bold">Cliente<input required value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-700 bg-[#202020] px-3 py-2.5 font-normal outline-none focus:border-[#F1C40F]" /></label>
              <label className="text-sm font-bold">Telefone / WhatsApp<input required value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} inputMode="tel" className="mt-1 w-full rounded-lg border border-gray-700 bg-[#202020] px-3 py-2.5 font-normal outline-none focus:border-[#F1C40F]" /></label>
            </section>

            <section className="rounded-xl border border-gray-800 bg-black/20 p-4">
              <h3 className="mb-3 font-black">Atendimento</h3>
              <div className="mb-4 grid grid-cols-2 gap-2">{(["RETIRADA", "ENTREGA"] as const).map((mode) => <button key={mode} type="button" onClick={() => setDeliveryMode(mode)} className={`rounded-lg border px-3 py-2.5 text-sm font-black ${deliveryMode === mode ? "border-[#F1C40F] bg-[#F1C40F]/15 text-[#F1C40F]" : "border-gray-700 text-gray-400"}`}>{mode === "RETIRADA" ? "Retirada" : "Entrega"}</button>)}</div>
              {deliveryMode === "ENTREGA" && <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm font-bold sm:col-span-2">Bairro<select required value={neighborhoodName} onChange={(e) => setNeighborhoodName(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-700 bg-[#202020] px-3 py-2.5 font-normal"><option value="">Selecione...</option>{neighborhoods.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}</select></label>
                <label className="text-sm font-bold">Rua<input required value={street} onChange={(e) => setStreet(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-700 bg-[#202020] px-3 py-2.5 font-normal" /></label>
                <label className="text-sm font-bold">Número<input required value={number} onChange={(e) => setNumber(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-700 bg-[#202020] px-3 py-2.5 font-normal" /></label>
                <label className="text-sm font-bold sm:col-span-2">Complemento (opcional)<input value={complement} onChange={(e) => setComplement(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-700 bg-[#202020] px-3 py-2.5 font-normal" /></label>
              </div>}
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between"><h3 className="font-black">Itens do pedido</h3><button type="button" onClick={() => setLines((current) => [...current, { key: nextKey.current++, productId: null, quantity: 1, addonIds: [] }])} className="rounded-lg bg-[#F1C40F]/15 px-3 py-2 text-sm font-black text-[#F1C40F]">+ Adicionar item</button></div>
              {loadingOptions && <p className="text-sm text-gray-400">Carregando cardápio...</p>}
              {lines.map((line, index) => {
                const product = products.find((entry) => entry.id === line.productId);
                return <div key={line.key} className="rounded-xl border border-gray-800 bg-black/20 p-4">
                  <div className="grid items-end gap-3 sm:grid-cols-[1fr_100px_auto]">
                    <label className="text-sm font-bold">Produto<select required value={line.productId ?? ""} onChange={(e) => updateLine(line.key, { productId: e.target.value ? Number(e.target.value) : null, addonIds: [] })} className="mt-1 w-full rounded-lg border border-gray-700 bg-[#202020] px-3 py-2.5 font-normal"><option value="">Selecione...</option>{products.map((entry) => <option key={entry.id} value={entry.id}>{entry.name} — {BRL(Number(entry.price))}</option>)}</select></label>
                    <label className="text-sm font-bold">Quantidade<input type="number" required min={1} value={line.quantity} onChange={(e) => updateLine(line.key, { quantity: Math.max(1, Number(e.target.value)) })} className="mt-1 w-full rounded-lg border border-gray-700 bg-[#202020] px-3 py-2.5 font-normal" /></label>
                    <button type="button" disabled={lines.length === 1} onClick={() => setLines((current) => current.filter((entry) => entry.key !== line.key))} className="rounded-lg border border-red-500/30 px-3 py-2.5 text-sm font-bold text-red-300 disabled:opacity-30">Remover</button>
                  </div>
                  {product && <div className="mt-3 border-t border-gray-800 pt-3">
                    <p className="mb-2 text-xs font-black uppercase tracking-wider text-gray-400">Adicionais</p>
                    {(product.addons ?? []).filter((addon) => addon.active).length ? <div className="grid gap-2 sm:grid-cols-2">{(product.addons ?? []).filter((addon) => addon.active).map((addon) => <label key={addon.id} className={`flex cursor-pointer items-center justify-between rounded-lg border p-2.5 text-sm ${line.addonIds.includes(addon.id) ? "border-[#F1C40F] bg-[#F1C40F]/10" : "border-gray-700"}`}><span><input type={addon.selectionType === "SINGLE" ? "radio" : "checkbox"} name={`line-${line.key}-${addon.groupName}`} checked={line.addonIds.includes(addon.id)} onChange={() => selectAddon(line, product, addon.id)} className="mr-2" />{addon.name}</span><strong>+ {BRL(Number(addon.price))}</strong></label>)}</div> : <p className="text-sm text-gray-500">Este produto não possui adicionais disponíveis.</p>}
                  </div>}
                  <div className="mt-3 text-right text-sm font-black text-[#F1C40F]">Item {index + 1}: {product ? BRL((Number(product.price) + (product.addons ?? []).filter((addon) => line.addonIds.includes(addon.id)).reduce((sum, addon) => sum + Number(addon.price), 0)) * line.quantity) : BRL(0)}</div>
                </div>;
              })}
            </section>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-0 lg:self-start">
            <section className="rounded-xl border border-gray-800 bg-black/20 p-4">
              <h3 className="mb-3 font-black">Pagamento</h3>
              <div className="grid grid-cols-2 gap-2">{(["DINHEIRO", "CARTAO"] as const).map((method) => <button key={method} type="button" onClick={() => { setPaymentMethod(method); if (method === "CARTAO") setChangeFor(""); }} className={`rounded-lg border px-3 py-2.5 text-sm font-black ${paymentMethod === method ? "border-[#F1C40F] bg-[#F1C40F]/15 text-[#F1C40F]" : "border-gray-700 text-gray-400"}`}>{method === "DINHEIRO" ? "Dinheiro" : "Cartão"}</button>)}</div>
              {paymentMethod === "DINHEIRO" && <label className="mt-3 block text-sm font-bold">Troco para (opcional)<input value={changeFor} onChange={(e) => setChangeFor(e.target.value)} inputMode="decimal" placeholder="Ex.: 100,00" className="mt-1 w-full rounded-lg border border-gray-700 bg-[#202020] px-3 py-2.5 font-normal" /></label>}
              <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs font-bold text-amber-200">O pedido será criado como A RECEBER. Marque como pago somente depois de receber.</div>
            </section>
            <label className="block text-sm font-bold">Observação do pedido<textarea value={observation} onChange={(e) => setObservation(e.target.value)} rows={4} className="mt-1 w-full resize-y rounded-lg border border-gray-700 bg-[#202020] px-3 py-2.5 font-normal" placeholder="Ex.: retirar cebola, chamar no portão..." /></label>
            <section className="rounded-xl border border-[#F1C40F]/25 bg-[#F1C40F]/5 p-4"><h3 className="mb-3 font-black">Resumo</h3><div className="space-y-2 text-sm"><div className="flex justify-between"><span>Subtotal</span><strong>{BRL(subtotal)}</strong></div><div className="flex justify-between"><span>Frete</span><strong>{BRL(deliveryFee)}</strong></div><div className="flex justify-between border-t border-gray-700 pt-3 text-lg"><span>Total</span><strong className="text-[#F1C40F]">{BRL(subtotal + deliveryFee)}</strong></div></div></section>
          </aside>
        </div>

        {error && <div aria-live="polite" className="mx-4 mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-200 sm:mx-6">{error}</div>}
        <footer className="grid gap-2 border-t border-gray-800 p-4 sm:grid-cols-2 sm:px-6">
          <button type="submit" disabled={submitting || loadingOptions} className="rounded-xl bg-[#F1C40F] px-4 py-3 font-black text-[#121212] disabled:cursor-wait disabled:opacity-50">{submitting ? "Criando pedido..." : "Criar pedido"}</button>
          <button type="button" onClick={() => void submit(true)} disabled={submitting || loadingOptions} className="rounded-xl border border-[#F1C40F] px-4 py-3 font-black text-[#F1C40F] disabled:cursor-wait disabled:opacity-50">Criar e imprimir</button>
        </footer>
      </form>
    </div>
  );
}
