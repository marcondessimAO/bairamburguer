"use client";

import { useEffect, useState } from "react";
import { useCart, Product } from "@/contexts/CartContext";
import { ProductDetailModal } from "@/components/ui/ProductDetailModal";
import { Flame, Star } from "lucide-react";
import { getImageUrl } from "@/utils/imageUrl";

type Category = {
  name: string;
};

type Produto = Product;

export default function Cardapio() {
  const { addToCart, setIsCartOpen, cartItems, subtotal, pendingPayment, isStoreOpen } = useCart();
  const [products, setProducts] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Produto | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("Todos");

  useEffect(() => {
    fetch("http://localhost:8080/api/products")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data: Produto[]) => {
        setProducts(data);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#121212] flex flex-col items-center justify-center font-sans text-[#FFFFFF]">
        <div className="w-16 h-16 border-4 border-[#F1C40F] border-t-transparent rounded-full animate-spin mb-6"></div>
        <h1 className="text-2xl font-medium tracking-tight">
          Preparando o cardápio...
        </h1>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[#121212] flex flex-col items-center justify-center p-6 font-sans text-[#FFFFFF]">
        <div className="bg-[#1e1e1e] p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.5)] max-w-md text-center border border-gray-800">
          <h1 className="text-2xl font-bold mb-2 tracking-tight">
            Cardápio indisponível
          </h1>
          <p className="text-gray-400">
            Não conseguimos carregar os nossos lanches no momento. Tente novamente mais tarde.
          </p>
        </div>
      </main>
    );
  }

  const categories = ["Todos", ...Array.from(new Set(products.map(p => p.category?.name || "OUTROS")))];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = activeCategory === "Todos" || (product.category?.name || "OUTROS") === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const featuredProducts = products.filter(p => p.isAvailable && p.isPromotion);

  return (
    <main className="min-h-screen bg-[#121212] font-sans text-[#FFFFFF] relative flex flex-col">
      {/* Product Detail Modal */}
      <ProductDetailModal 
        isOpen={!!selectedProduct} 
        onClose={() => setSelectedProduct(null)} 
        product={selectedProduct} 
      />

      {/* Header & Busca Fixos no Topo */}
      <div className="pt-6 pb-2 px-4 sticky top-0 bg-[#121212] z-30">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-black text-white tracking-tight">Bairam Burguer e Petiscaria</h1>
          <img src="/images/bairam-logo.jpg.jpg" alt="Logo" className="w-10 h-10 rounded-full object-cover border border-gray-800" />
        </div>
        
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input 
            type="text" 
            placeholder="Buscar lanches..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#1e1e1e] text-white rounded-2xl pl-12 pr-4 py-3.5 focus:outline-none focus:ring-1 focus:ring-[#F1C40F] transition-all placeholder:text-gray-500 font-medium"
          />
        </div>
      </div>

      {/* Banner Loja Fechada */}
      {!isStoreOpen && (
        <div className="bg-red-600/90 backdrop-blur-sm text-white px-4 py-2 flex items-center justify-center gap-2 font-bold text-sm sticky top-[108px] z-20 shadow-lg shadow-red-900/20">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Estamos fechados no momento. Você pode navegar, mas não realizar pedidos.
        </div>
      )}

      {/* Secção de Destaques Premium */}
      {featuredProducts.length > 0 && (
        <section className="mb-8 mt-2 px-4">
          <div className="flex items-center gap-2 mb-4">
            <Flame className="w-8 h-8 text-[#F1C40F]" fill="#F1C40F" />
            <h2 className="text-3xl font-black text-white tracking-tight">Destaques da Bairam</h2>
          </div>
          
          <div className="flex overflow-x-auto pb-6 -mx-4 px-4 gap-6 snap-x snap-mandatory scrollbar-hide">
            {featuredProducts.map((produto) => (
              <article 
                key={produto.id} 
                className="relative min-w-[280px] w-[85vw] max-w-[320px] snap-center shrink-0 bg-[#1e1e1e] rounded-3xl overflow-hidden cursor-pointer flex flex-col hover:bg-[#242424] transition-all duration-300 border-2 border-[#F1C40F] shadow-[0_0_20px_rgba(241,196,15,0.2)]"
                onClick={() => setSelectedProduct(produto)}
              >
                {/* O efeito de pulso na borda */}
                <div className="absolute inset-0 rounded-3xl border-2 border-[#F1C40F] opacity-50 animate-pulse pointer-events-none"></div>

                {/* Imagem de Destaque */}
                <div className="relative w-full h-48 bg-[#2a2a2a]">
                  {produto.imageUrl ? (
                    <img 
                      src={getImageUrl(produto.imageUrl)} 
                      alt={produto.name} 
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-600">
                      <Flame className="w-12 h-12 opacity-50" />
                    </div>
                  )}
                  {/* Ícone Star Dourado no Canto Superior Direito */}
                  <div className="absolute top-3 right-3 bg-[#121212]/80 backdrop-blur-md p-2 rounded-full border border-[#F1C40F] shadow-lg">
                    <Star className="w-5 h-5 text-[#F1C40F]" fill="#F1C40F" />
                  </div>
                </div>
                
                {/* Textos e Botão */}
                <div className="flex flex-col flex-1 p-5 relative z-10 bg-gradient-to-t from-[#121212] via-[#1e1e1e] to-[#1e1e1e]">
                  <h3 className="text-white font-black text-xl mb-2 line-clamp-1">
                    {produto.name}
                  </h3>
                  <p className="text-gray-400 text-sm line-clamp-2 mb-4 flex-grow">
                    {produto.description || "O melhor sabor da Bairam em destaque para você."}
                  </p>
                  
                  <div className="flex justify-between items-end mt-auto">
                    <span className="text-[#F1C40F] font-black text-2xl">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(produto.price)}
                    </span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(produto, 1);
                      }}
                      className="flex items-center justify-center w-10 h-10 bg-[#F1C40F] rounded-xl shadow-[0_4px_15px_rgba(241,196,15,0.4)] hover:bg-[#F39C12] hover:scale-110 transition-all z-20"
                      aria-label="Adicionar destaque"
                    >
                      <span className="text-[#121212] font-black text-2xl mt-[-2px]">+</span>
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Carrossel de Categorias */}
      <div className="px-4 mt-4 mb-6">
        <div className="overflow-x-auto scrollbar-hide flex gap-5 pb-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap font-bold text-sm pb-2 border-b-2 transition-all ${
                activeCategory === cat 
                  ? "text-[#F1C40F] border-[#F1C40F]" 
                  : "text-gray-500 border-transparent hover:text-gray-300"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Listagem de Produtos */}
      <div className="flex-1 px-4 space-y-4 pb-28">
        {filteredProducts.length === 0 ? (
           <div className="text-center py-16 bg-[#1e1e1e] rounded-3xl border border-gray-800/60 mx-auto max-w-sm mt-8">
             <svg className="w-12 h-12 text-gray-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
             </svg>
             <p className="text-gray-400 font-medium">Nenhum lanche encontrado.</p>
           </div>
        ) : (
          filteredProducts.map((produto) => (
            <article 
              key={produto.id} 
              className="relative flex flex-row items-center gap-4 p-3 bg-[#1e1e1e] rounded-2xl overflow-hidden cursor-pointer w-full hover:bg-[#242424] transition-colors border border-gray-800/60"
              onClick={() => setSelectedProduct(produto)}
            >
              {/* A Imagem do Produto (Lado Esquerdo) */}
              <div className="relative w-24 h-24 shrink-0 rounded-xl overflow-hidden bg-[#2a2a2a]">
                {produto.imageUrl ? (
                  <img 
                    src={getImageUrl(produto.imageUrl)} 
                    alt={produto.name} 
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-600">
                    <svg className="w-8 h-8 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>
              
              {/* Textos (Lado Direito) */}
              <div className="flex flex-col flex-1 py-1 pr-6">
                <h3 className="text-white font-bold text-base leading-tight line-clamp-1">
                  {produto.name}
                </h3>
                <p className="text-gray-400 text-xs line-clamp-2 mt-1">
                  {produto.description || "Delicioso produto com ingredientes selecionados."}
                </p>
                
                <span className="text-white font-semibold text-sm mt-2">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(produto.price)}
                </span>
              </div>

              {/* O Botão de Adicionar (+) */}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  addToCart(produto, 1);
                }}
                className="absolute bottom-3 right-3 flex items-center justify-center w-8 h-8 bg-[#F1C40F] rounded-full hover:scale-105 transition-transform z-10"
                aria-label="Adicionar 1 unidade"
              >
                <span className="text-[#121212] font-black text-lg leading-none mt-[1px]">+</span>
              </button>
            </article>
          ))
        )}
      </div>

      {/* Banner de Pagamento Pendente */}
      {pendingPayment && (
        <div 
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-16 w-full bg-[#F1C40F] text-[#121212] py-3 px-4 text-center font-bold text-sm shadow-[0_-4px_10px_rgba(0,0,0,0.2)] cursor-pointer z-30 transition-colors hover:bg-[#D4AC0D] flex items-center justify-center gap-2"
        >
          <span>⚠️</span>
          Pedido Iniciado - Aguardando Pagamento (Clique para ver o Pix)
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 w-full bg-[#121212] border-t border-[#1e1e1e] flex justify-around items-center h-16 pb-safe z-40">
        <button className="flex flex-col items-center justify-center w-full h-full text-[#F1C40F]">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </button>
        
        <button className="flex flex-col items-center justify-center w-full h-full text-gray-500 hover:text-gray-400">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </button>

        <button 
          onClick={() => setIsCartOpen(true)}
          className="flex flex-col items-center justify-center w-full h-full text-gray-500 hover:text-gray-400 relative"
        >
          <div className="relative">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-[#F1C40F] text-[#121212] text-[10px] font-black w-[18px] h-[18px] flex items-center justify-center rounded-full border-2 border-[#121212]">
                {totalItems}
              </span>
            )}
          </div>
        </button>

        <button className="flex flex-col items-center justify-center w-full h-full text-gray-500 hover:text-gray-400">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </button>
      </nav>
    </main>
  );
}
