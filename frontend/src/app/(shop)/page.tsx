"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useCart, Product } from "@/contexts/CartContext";
import { ProductDetailModal } from "@/components/ui/ProductDetailModal";
import { Flame } from "lucide-react";
import { getImageUrl } from "@/utils/imageUrl";
import Link from "next/link";

type Produto = Product;

const PROMOTION_CATEGORY = "PROMOÇÕES BAIRAM";
const CATEGORY_ORDER = [PROMOTION_CATEGORY, "BAIRAM MALUCA", "BAIRAM INDIVIDUAIS", "COMBOS", "COMPLEMENTOS", "PETISCOS", "MILKSHAKES"];

const normalizeName = (value: string) =>
  value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

const categoryLabel = (name: string) => {
  const normalized = normalizeName(name);
  if (normalized.includes("bairam maluca")) return "BAIRAM MALUCA";
  if (normalized.includes("bairam individuais") || normalized.includes("bairans individuais")) return "BAIRAM INDIVIDUAIS";
  if (normalized.includes("combo")) return "COMBOS";
  if (normalized.includes("complement")) return "COMPLEMENTOS";
  if (normalized.includes("petisco")) return "PETISCOS";
  if (normalized.includes("milkshake")) return "MILKSHAKES";
  return name.toUpperCase();
};

const isIndividualProduct = (product: Product) => categoryLabel(product.category?.name ?? "") === "BAIRAM INDIVIDUAIS";

export default function Cardapio() {
  const { addToCart, setIsCartOpen, cartItems, pendingPayment, isStoreOpen } = useCart();
  const [products, setProducts] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Produto | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState(PROMOTION_CATEGORY);
  const categoryRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    const baseUrl = "/api";
    fetch(`${baseUrl}/products`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data: Produto[]) => {
        setProducts(data.filter(product => product.isAvailable));
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  const categories = useMemo(() => {
    const availableCategories = new Set(products.map(p => categoryLabel(p.category?.name || "OUTROS")));
    if (products.some(product => product.isAvailable && product.isPromotion)) {
      availableCategories.add(PROMOTION_CATEGORY);
    }
    return CATEGORY_ORDER.filter((category) => availableCategories.has(category));
  }, [products]);
  const selectedCategory = categories.includes(activeCategory) ? activeCategory : categories[0];

  const filteredProducts = useMemo(() => products.filter(product => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) return true;

    return product.name.toLowerCase().includes(normalizedSearch) ||
      Boolean(product.description?.toLowerCase().includes(normalizedSearch));
  }), [products, searchTerm]);

  const productSections = useMemo(() => categories
    .map(category => {
      if (category === PROMOTION_CATEGORY) {
        return {
          category,
          products: filteredProducts.filter(product => product.isAvailable && product.isPromotion),
        };
      }

      return {
        category,
        products: filteredProducts.filter(product =>
          categoryLabel(product.category?.name || "OUTROS") === category && !product.isPromotion
        ),
      };
    })
    .filter(section => section.products.length > 0), [categories, filteredProducts]);

  useEffect(() => {
    const visibleCategories = new Map<string, number>();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const category = entry.target.getAttribute("data-category");
        if (!category) return;

        if (entry.isIntersecting) {
          visibleCategories.set(category, entry.boundingClientRect.top);
        } else {
          visibleCategories.delete(category);
        }
      });

      const nextCategory = Array.from(visibleCategories.entries())
        .sort((first, second) => Math.abs(first[1]) - Math.abs(second[1]))[0]?.[0];

      if (nextCategory) {
        setActiveCategory(nextCategory);
      }
    }, {
      rootMargin: "-190px 0px -55% 0px",
      threshold: [0, 0.15, 0.35],
    });

    productSections.forEach(({ category }) => {
      const section = categoryRefs.current[category];
      if (section) observer.observe(section);
    });

    return () => observer.disconnect();
  }, [productSections]);

  const scrollToCategory = (category: string) => {
    setActiveCategory(category);
    categoryRefs.current[category]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#07110B] flex flex-col items-center justify-center font-sans text-[#FFF8E6]">
        <div className="w-16 h-16 border-4 border-[#B7D438] border-t-transparent rounded-full animate-spin mb-6"></div>
        <h1 className="text-2xl font-medium tracking-tight">
          Preparando o cardÃ¡pio...
        </h1>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[#07110B] flex flex-col items-center justify-center p-6 font-sans text-[#FFF8E6]">
        <div className="bg-[#122016] p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.5)] max-w-md text-center border border-[#35532A]">
          <h1 className="text-2xl font-bold mb-2 tracking-tight">
            CardÃ¡pio indisponÃ­vel
          </h1>
          <p className="text-gray-400">
            NÃ£o conseguimos carregar os nossos lanches no momento. Tente novamente mais tarde.
          </p>
        </div>
      </main>
    );
  }

  const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <main className="min-h-screen bg-[#07110B] [background-image:linear-gradient(135deg,rgba(183,212,56,0.045)_1px,transparent_1px),radial-gradient(circle_at_top,rgba(8,82,43,0.38),transparent_34rem)] [background-size:26px_26px,100%_100%] font-sans text-[#FFF8E6] relative flex flex-col uppercase">
      {/* Product Detail Modal */}
      <ProductDetailModal 
        isOpen={!!selectedProduct} 
        onClose={() => setSelectedProduct(null)} 
        product={selectedProduct} 
      />

      {/* Header & Busca Fixos no Topo */}
      <div className="pt-6 pb-3 px-4 sticky top-0 bg-[#07110B]/95 backdrop-blur-md z-30 border-b border-[#22391F]/70 w-full max-w-[560px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-[#FFF8E6] tracking-tight leading-none">Bairam Burguer</h1>
            <p className="mt-1 text-sm font-black tracking-wide text-[#B7D438]">E PETISCARIA</p>
          </div>
          <img src="/images/bairam-logo.jpg.jpg" alt="Logo" className="w-12 h-12 rounded-full object-cover border-2 border-[#FFF8E6] shadow-[0_0_0_3px_rgba(183,212,56,0.28)]" />
        </div>
        
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-[#B7D438]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input 
            type="text" 
            placeholder="Buscar lanches..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#111A13] text-[#FFF8E6] rounded-2xl pl-12 pr-4 py-3.5 border border-[#2B4725] focus:outline-none focus:ring-2 focus:ring-[#B7D438]/70 transition-all placeholder:text-[#859279] font-medium shadow-inner"
          />
        </div>
      </div>

      {/* Banner Loja Fechada */}
      {!isStoreOpen && (
        <div className="bg-[#B42318]/95 backdrop-blur-sm text-white px-4 py-2 flex items-center justify-center gap-2 font-bold text-sm sticky top-[118px] z-20 shadow-lg shadow-red-900/20">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Estamos fechados no momento. VocÃª pode navegar, mas nÃ£o realizar pedidos.
        </div>
      )}


      {/* Carrossel de Categorias */}
      <div className="px-4 mt-5 mb-6 w-full max-w-[560px] mx-auto sticky top-[118px] z-20 bg-[#07110B]/95 backdrop-blur-md border-b border-[#22391F]/70">
        <div className="overflow-x-auto scrollbar-hide flex gap-5 pb-2 pt-3">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => scrollToCategory(cat)}
              className={`whitespace-nowrap font-bold text-sm pb-2 border-b-2 transition-all ${
                selectedCategory === cat
                  ? "text-[#F6B51B] border-[#F6B51B]"
                  : "text-[#7E8D75] border-transparent hover:text-[#C7D3B6]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Listagem de Produtos */}
      <div className="flex-1 px-4 space-y-4 pb-28 w-full max-w-[560px] mx-auto">
        {productSections.length === 0 ? (
           <div className="text-center py-16 bg-[#101A12] rounded-3xl border border-[#2B4725]/70 mx-auto max-w-sm mt-8">
             <svg className="w-12 h-12 text-[#6F8064] mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
             </svg>
             <p className="text-[#C7D3B6] font-medium">Nenhum lanche encontrado.</p>
           </div>
        ) : (
          productSections.flatMap(({ category, products: sectionProducts }) => {
            const isPromotionSection = category === PROMOTION_CATEGORY;

            return [
            <div
              key={`${category}-heading`}
              ref={(element) => {
                categoryRefs.current[category] = element;
              }}
              data-category={category}
              className={`scroll-mt-48 ${isPromotionSection ? "rounded-2xl border border-[#B7D438]/50 bg-[#101A12] p-4 shadow-[0_12px_28px_rgba(0,0,0,0.28)]" : "pt-2"}`}
            >
              <div className="flex items-center gap-2">
                {isPromotionSection && <Flame className="h-5 w-5 text-[#F6B51B]" fill="#F6B51B" />}
                <h2 className="text-lg font-black tracking-wide text-[#FFF8E6]">{category}</h2>
              </div>
              {isPromotionSection && (
                <p className="mt-1 text-xs font-semibold text-[#C7D3B6]">
                  Ofertas selecionadas para pedir agora.
                </p>
              )}
            </div>,
            ...sectionProducts.map((produto) => (
            <article 
              key={produto.id} 
              className={`relative flex flex-row items-center gap-4 p-3 bg-[#101A12] rounded-2xl overflow-hidden cursor-pointer w-full hover:bg-[#162315] transition-colors shadow-[0_10px_22px_rgba(0,0,0,0.24)] ${isPromotionSection ? "border border-[#B7D438]/80" : "border border-[#2B4725]/70"}`}
              onClick={() => setSelectedProduct(produto)}
            >
              {isPromotionSection && (
                <span className="absolute right-3 top-3 z-10 rounded-full bg-[#B7D438] px-2 py-0.5 text-[10px] font-black text-[#07110B] shadow-[0_4px_12px_rgba(183,212,56,0.24)]">
                  PROMO
                </span>
              )}
              {/* A Imagem do Produto (Lado Esquerdo) */}
              <div className="relative w-24 h-24 shrink-0 rounded-xl overflow-hidden bg-[#172315] border border-[#35532A]/70">
                {produto.imageUrl ? (
                  <img 
                    src={getImageUrl(produto.imageUrl)} 
                    alt={produto.name} 
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-[#6F8064]">
                    <svg className="w-8 h-8 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>
              
              {/* Textos (Lado Direito) */}
              <div className="flex flex-col flex-1 py-1 pr-6">
                <h3 className="text-[#FFF8E6] font-bold text-base leading-tight line-clamp-1">
                  {produto.name}
                </h3>
                <p className="text-[#C7D3B6] text-xs line-clamp-2 mt-1">
                  {produto.description || "Delicioso produto com ingredientes selecionados."}
                </p>
                
                <span className="text-[#FFF8E6] font-semibold text-sm mt-2">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(produto.price)}
                </span>
              </div>

              {/* O BotÃ£o de Adicionar (+) */}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  if (isIndividualProduct(produto)) {
                    setSelectedProduct(produto);
                  } else {
                    addToCart(produto, 1);
                  }
                }}
                className="absolute bottom-3 right-3 flex items-center justify-center w-8 h-8 bg-[#F6B51B] rounded-full hover:scale-105 transition-transform z-10 shadow-[0_4px_12px_rgba(246,181,27,0.35)]"
                aria-label="Adicionar 1 unidade"
              >
                <span className="text-[#07110B] font-black text-lg leading-none mt-[1px]">+</span>
              </button>
            </article>
          ))];
          })
        )}
      </div>

      {/* Banner de Pagamento Pendente */}
      {pendingPayment && (
        <div 
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-16 w-full bg-[#F6B51B] text-[#07110B] py-3 px-4 text-center font-bold text-sm shadow-[0_-4px_10px_rgba(0,0,0,0.2)] cursor-pointer z-30 transition-colors hover:bg-[#FFD33D] flex items-center justify-center gap-2"
        >
          <span>âš ï¸</span>
          Pedido Iniciado - Aguardando Pagamento (Clique para ver o Pix)
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 w-full bg-[#07110B]/95 backdrop-blur-md border-t border-[#22391F] flex justify-around items-center h-16 pb-safe z-40">
        <Link href="/" className="flex flex-col items-center justify-center w-full h-full text-[#F6B51B]">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </Link>
        
        <Link href="/pedidos" className="flex flex-col items-center justify-center w-full h-full text-[#7E8D75] hover:text-[#C7D3B6]">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </Link>

        <button 
          onClick={() => setIsCartOpen(true)}
          className="flex flex-col items-center justify-center w-full h-full text-[#7E8D75] hover:text-[#C7D3B6] relative"
        >
          <div className="relative">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-[#F6B51B] text-[#07110B] text-[10px] font-black w-[18px] h-[18px] flex items-center justify-center rounded-full border-2 border-[#07110B]">
                {totalItems}
              </span>
            )}
          </div>
        </button>

        <button className="flex flex-col items-center justify-center w-full h-full text-[#7E8D75] hover:text-[#C7D3B6]">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </button>
      </nav>
    </main>
  );
}
