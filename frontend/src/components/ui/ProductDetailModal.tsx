"use client";

import React, { useState, useMemo } from "react";
import { Product, useCart } from "@/contexts/CartContext";
import { getImageUrl } from "@/utils/imageUrl";

interface ProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

export function ProductDetailModal({ isOpen, onClose, product }: ProductDetailModalProps) {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedAddonIds, setSelectedAddonIds] = useState<number[]>([]);

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setQuantity(1);
      setSelectedAddonIds([]);
    }, 300);
  };

  // Group addons by groupName
  const groupedAddons = useMemo(() => {
    if (!product || !product.addons) return {};
    const groups: Record<string, typeof product.addons> = {};
    for (const addon of product.addons) {
      if (!groups[addon.groupName]) {
        groups[addon.groupName] = [];
      }
      groups[addon.groupName].push(addon);
    }
    return groups;
  }, [product]);

  if (!isOpen || !product) return null;

  const handleAddToCart = () => {
    const chosenAddons = product.addons?.filter(a => selectedAddonIds.includes(a.id)) || [];
    const addonsTotal = chosenAddons.reduce((sum, a) => sum + a.price, 0);
    
    const summary = chosenAddons.map(a => {
      if (a.price > 0) {
        return `${a.name} (+ R$ ${a.price.toFixed(2).replace('.', ',')})`;
      }
      return a.name;
    }).join("; ");

    addToCart(product, quantity, {
      addonIds: selectedAddonIds,
      addonsSummary: summary || undefined,
      addonsTotal: addonsTotal
    });
    handleClose();
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) handleClose();
  };

  const chosenAddons = product.addons?.filter(a => selectedAddonIds.includes(a.id)) || [];
  const addonTotal = chosenAddons.reduce((sum, a) => sum + a.price, 0);

  const formattedPrice = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format((product.price + addonTotal) * quantity);

  const handleSelectSingle = (addonId: number, groupAddonIds: number[]) => {
    setSelectedAddonIds(prev => {
      const filtered = prev.filter(id => !groupAddonIds.includes(id));
      if (prev.includes(addonId)) {
        return filtered;
      }
      return [...filtered, addonId];
    });
  };

  const handleToggleMultiple = (addonId: number) => {
    setSelectedAddonIds(prev => 
      prev.includes(addonId) 
        ? prev.filter(id => id !== addonId) 
        : [...prev, addonId]
    );
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center transition-opacity"
        onClick={handleOverlayClick}
      >
        {/* Modal Container */}
        <div className="bg-[#07110B] w-full sm:w-[480px] sm:rounded-[2rem] rounded-t-[2rem] overflow-hidden flex flex-col max-h-[90vh] shadow-[0_-10px_40px_rgba(0,0,0,0.5)] sm:shadow-[0_20px_60px_rgba(0,0,0,0.5)] border-t sm:border border-[#2B4725] transition-transform duration-300 relative">
          
          {/* Close Button */}
          <button 
            onClick={handleClose}
            className="absolute top-4 right-4 z-20 w-10 h-10 bg-[#07110B]/70 hover:bg-[#07110B] text-[#FFF8E6] rounded-full flex items-center justify-center backdrop-blur-md transition-colors border border-[#35532A]"
            aria-label="Fechar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Image Section */}
          <div className="w-full h-64 sm:h-72 bg-[#172315] relative flex-shrink-0">
            {product.imageUrl ? (
              <img 
                src={getImageUrl(product.imageUrl)} 
                alt={product.name} 
                className="w-full h-full object-cover scale-75"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-[#6F8064]">
                <svg className="w-16 h-16 mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="font-bold uppercase tracking-wider opacity-50">Sem imagem</span>
              </div>
            )}
            
            {/* Gradient Overlay for smooth transition to dark background */}
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#07110B] to-transparent"></div>
          </div>

          {/* Content Section */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col bg-[#07110B]">
            <h2 className="text-2xl font-black text-[#FFF8E6] tracking-tight mb-2 uppercase">
              {product.name}
            </h2>
            <p className="text-[#C7D3B6] text-sm sm:text-base leading-relaxed mb-6">
              {product.description || "Delicioso produto preparado com ingredientes selecionados e muito carinho."}
            </p>

            <div className="space-y-6">
              {/* Dynamic Addons Sections */}
              {Object.entries(groupedAddons).map(([groupName, groupItems]) => {
                const groupItemIds = groupItems.map(item => item.id);
                const isSingle = groupItems[0]?.selectionType === 'SINGLE';

                return (
                  <div key={groupName} className="bg-[#101A12] p-4 rounded-2xl border border-[#2B4725]">
                    <span className="block text-[#C7D3B6] font-black uppercase text-sm mb-3">
                      {groupName} {isSingle ? '(Escolha uma opção)' : '(Escolha opcional)'}
                    </span>
                    <div className="flex flex-col gap-2">
                      {groupItems.map((addon) => {
                        const isSelected = selectedAddonIds.includes(addon.id);
                        return (
                          <div 
                            key={addon.id}
                            onClick={() => {
                              if (isSingle) {
                                handleSelectSingle(addon.id, groupItemIds);
                              } else {
                                handleToggleMultiple(addon.id);
                              }
                            }}
                            className={`flex items-center justify-between rounded-xl border px-4 py-3 cursor-pointer transition-colors ${
                              isSelected
                                ? "border-[#F6B51B] bg-[#F6B51B] text-[#07110B]"
                                : "border-[#35532A] bg-[#172315] text-[#C7D3B6]"
                            }`}
                          >
                            <span className="font-bold text-sm uppercase">{addon.name}</span>
                            <span className="font-semibold text-sm">
                              {addon.price > 0 ? `+ R$ ${addon.price.toFixed(2).replace('.', ',')}` : "Grátis"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Quantity Selector */}
              <div className="flex items-center justify-between bg-[#101A12] p-4 rounded-2xl border border-[#2B4725]">
                <span className="text-[#C7D3B6] font-medium uppercase text-sm">Quantidade</span>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="w-10 h-10 flex items-center justify-center bg-[#172315] hover:bg-[#20351E] disabled:opacity-50 disabled:cursor-not-allowed text-[#FFF8E6] rounded-xl transition-colors font-bold text-lg"
                  >
                    −
                  </button>
                  <span className="text-xl font-black text-[#FFF8E6] w-8 text-center tabular-nums">
                    {quantity}
                  </span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 flex items-center justify-center bg-[#172315] hover:bg-[#20351E] text-[#FFF8E6] rounded-xl transition-colors font-bold text-lg"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Add to Cart Button */}
              <button 
                onClick={handleAddToCart}
                className="w-full flex items-center justify-center py-4 bg-[#F6B51B] hover:bg-[#FFD33D] text-[#07110B] rounded-2xl font-black text-lg shadow-[0_4px_14px_rgba(246,181,27,0.4)] active:scale-[0.98] transition-all"
              >
                <span>ADICIONAR AO CARRINHO</span>
                <span className="mx-3 w-1.5 h-1.5 rounded-full bg-[#07110B]/30"></span>
                <span>{formattedPrice}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
