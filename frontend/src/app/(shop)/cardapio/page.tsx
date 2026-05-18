"use client";

import { useEffect, useState } from "react";

type Category = {
  name: string;
};

type Produto = {
  id: number;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  category: Category;
};

export default function Cardapio() {
  const [products, setProducts] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

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

  // Agrupando produtos por categoria
  const groupedProducts = products.reduce((acc, product) => {
    const categoryName = product.category?.name || "OUTROS";
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(product);
    return acc;
  }, {} as Record<string, Produto[]>);

  return (
    <main className="min-h-screen bg-[#121212] p-6 md:p-12 font-sans text-[#FFFFFF]">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col items-center justify-center mb-14 border-b border-gray-800 pb-8 text-center">
          <img src="/images/bairam-logo.jpg.jpg" alt="Logo Bairamburguer" className="h-20 w-auto mb-6 rounded-lg" />
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter">
            Nosso Cardápio
          </h1>
          <p className="mt-3 text-gray-400 font-medium text-lg">
            Escolha o seu lanche e prepare-se para a melhor experiência.
          </p>
        </header>

        {Object.keys(groupedProducts).length === 0 ? (
           <div className="text-center py-24 bg-[#1e1e1e] rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-gray-800">
             <p className="text-gray-400 text-lg font-medium">Nenhum produto cadastrado no momento.</p>
           </div>
        ) : (
          <div className="space-y-16">
            {Object.entries(groupedProducts).map(([category, items]) => (
              <section key={category}>
                {/* Título da Categoria com Separador Ousado */}
                <div className="flex items-center mb-8">
                  <h2 className="text-2xl font-black uppercase tracking-widest mr-6 whitespace-nowrap">
                    {category}
                  </h2>
                  <div className="h-[2px] w-full bg-gray-800"></div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {items.map((produto) => (
                    <article 
                      key={produto.id} 
                      className="group bg-[#1e1e1e] rounded-[2rem] overflow-hidden shadow-[0_4px_20px_rgb(0,0,0,0.2)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.4)] border border-gray-800 transition-all duration-300 flex flex-col"
                    >
                      {/* Área da Imagem */}
                      <div className="w-full h-48 bg-[#2A2A2A] overflow-hidden relative border-b border-gray-800">
                        {produto.imageUrl ? (
                          <img 
                            src={produto.imageUrl} 
                            alt={produto.name} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-gray-600 bg-[#2A2A2A]">
                            <svg className="w-10 h-10 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-xs font-bold uppercase tracking-wider opacity-60">Sem foto</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Conteúdo do Card */}
                      <div className="p-6 flex flex-col flex-grow relative">
                        <h3 className="text-lg font-bold text-[#FFFFFF] mb-2 leading-tight">
                          {produto.name}
                        </h3>
                        <p className="text-sm text-gray-400 line-clamp-2 mb-6 pr-2 leading-relaxed">
                          {produto.description || "Delicioso produto preparado com ingredientes selecionados e muito carinho."}
                        </p>
                        
                        <div className="mt-auto pr-14">
                          <span className="text-xl font-black text-[#F1C40F]">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(produto.price)}
                          </span>
                        </div>

                        {/* Botão Adicionar Circular */}
                        <button 
                          className="absolute bottom-6 right-6 w-11 h-11 bg-[#F1C40F] hover:bg-[#D4AC0D] text-[#121212] rounded-full flex items-center justify-center shadow-md hover:shadow-xl transition-all duration-300 transform group-hover:scale-110 active:scale-95"
                          aria-label="Adicionar ao carrinho"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
