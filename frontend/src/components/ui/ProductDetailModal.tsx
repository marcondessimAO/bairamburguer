"use client";

import React, { useState, useEffect } from "react";
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

  // Reset quantity when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
    }
  }, [isOpen]);

  if (!isOpen || !product) return null;

  const handleAddToCart = () => {
    addToCart(product, quantity);
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const formattedPrice = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(product.price * quantity);

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center transition-opacity"
        onClick={handleOverlayClick}
      >
        {/* Modal Container */}
        <div className="bg-[#121212] w-full sm:w-[480px] sm:rounded-[2rem] rounded-t-[2rem] overflow-hidden flex flex-col max-h-[90vh] shadow-[0_-10px_40px_rgba(0,0,0,0.5)] sm:shadow-[0_20px_60px_rgba(0,0,0,0.5)] border-t sm:border border-gray-800 transition-transform duration-300 relative">
          
          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-10 h-10 bg-black/60 hover:bg-black/90 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-colors"
            aria-label="Fechar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Image Section */}
          <div className="w-full h-64 sm:h-72 bg-[#2A2A2A] relative flex-shrink-0">
            {product.imageUrl ? (
              <img 
                src={getImageUrl(product.imageUrl)} 
                alt={product.name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-600">
                <svg className="w-16 h-16 mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="font-bold uppercase tracking-wider opacity-50">Sem imagem</span>
              </div>
            )}
            
            {/* Gradient Overlay for smooth transition to dark background */}
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#121212] to-transparent"></div>
          </div>

          {/* Content Section */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col bg-[#121212]">
            <h2 className="text-2xl font-black text-[#FFFFFF] tracking-tight mb-2">
              {product.name}
            </h2>
            <p className="text-gray-400 text-sm sm:text-base leading-relaxed mb-8">
              {product.description || "Delicioso produto preparado com ingredientes selecionados e muito carinho."}
            </p>

            <div className="mt-auto pt-4 space-y-6">
              {/* Quantity Selector */}
              <div className="flex items-center justify-between bg-[#1e1e1e] p-4 rounded-2xl border border-gray-800">
                <span className="text-gray-300 font-medium">Quantidade</span>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="w-10 h-10 flex items-center justify-center bg-[#2A2A2A] hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-colors font-bold text-lg"
                  >
                    −
                  </button>
                  <span className="text-xl font-black text-white w-8 text-center tabular-nums">
                    {quantity}
                  </span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 flex items-center justify-center bg-[#2A2A2A] hover:bg-gray-700 text-white rounded-xl transition-colors font-bold text-lg"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Add to Cart Button */}
              <button 
                onClick={handleAddToCart}
                className="w-full flex items-center justify-center py-4 bg-[#F1C40F] hover:bg-[#D4AC0D] text-[#121212] rounded-2xl font-black text-lg shadow-[0_4px_14px_rgba(241,196,15,0.4)] active:scale-[0.98] transition-all"
              >
                <span>Adicionar ao carrinho</span>
                <span className="mx-3 w-1.5 h-1.5 rounded-full bg-[#121212]/30"></span>
                <span>{formattedPrice}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
