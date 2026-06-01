"use client";

import { useEffect, useState } from 'react';
import { adminService, ProductDTO } from '@/services/admin';
import { ProductFormModal } from '@/components/ui/ProductFormModal';
import { Plus, Edit2, Trash, Flame, Image as ImageIcon } from 'lucide-react';
import { getImageUrl } from "@/utils/imageUrl";

export default function AdminMenuPage() {
  const [products, setProducts] = useState<ProductDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductDTO | null>(null);

  const fetchProducts = async () => {
    try {
      const data = await adminService.getProducts();
      setProducts(data);
    } catch (err) {
      console.error('Erro ao buscar produtos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    adminService.getProducts()
      .then((data) => {
        if (isMounted) setProducts(data);
      })
      .catch((err) => {
        console.error('Erro ao buscar produtos:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleOpenModal = (product?: ProductDTO) => {
    setSelectedProduct(product || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem a certeza que deseja inativar este produto?')) return;
    try {
      await adminService.deleteProduct(id);
      fetchProducts();
    } catch (err) {
      alert('Erro ao inativar produto.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-[#1E1E1E] p-6 rounded-2xl border border-zinc-800 shadow-lg">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Gestão do Cardápio</h1>
          <p className="text-zinc-400 text-sm mt-1">Crie, edite e inative produtos</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-[#F1C40F] text-black px-4 py-2 rounded-xl font-bold hover:bg-[#F39C12] transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> Novo Produto
        </button>
      </div>

      <div className="bg-[#1E1E1E] rounded-2xl border border-zinc-800 shadow-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-zinc-400">A carregar produtos...</div>
        ) : products.length === 0 ? (
          <div className="p-8 text-center text-zinc-400">Nenhum produto cadastrado.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-300">
              <thead className="bg-[#181818] text-zinc-400 border-b border-zinc-800">
                <tr>
                  <th className="px-6 py-4 font-medium">Produto</th>
                  <th className="px-6 py-4 font-medium">Categoria</th>
                  <th className="px-6 py-4 font-medium">Preço</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-[#252525] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-4">
                        {product.imageUrl ? (
                          <div className="w-12 h-12 rounded-xl overflow-hidden border border-zinc-800">
                            <img 
                              src={getImageUrl(product.imageUrl)} 
                              alt={product.name} 
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-500">
                            <ImageIcon className="w-6 h-6" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-zinc-100 flex items-center gap-2">
                            {product.name}
                            {product.isPromotion && (
                              <Flame className="w-4 h-4 text-orange-500" />
                            )}
                          </div>
                          <div className="text-xs text-zinc-500 line-clamp-1">{product.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-zinc-800 text-zinc-300 px-2 py-1 rounded-md text-xs">
                        {product.category?.name || 'Sem categoria'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-[#F1C40F]">
                      R$ {product.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      {product.isAvailable ? (
                        <span className="text-green-400 bg-green-400/10 px-2 py-1 rounded-md text-xs border border-green-400/20">Ativo</span>
                      ) : (
                        <span className="text-red-400 bg-red-400/10 px-2 py-1 rounded-md text-xs border border-red-400/20">Inativo</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-3">
                        <button 
                          onClick={() => handleOpenModal(product)}
                          className="text-zinc-400 hover:text-blue-400 transition-colors p-2 rounded-lg hover:bg-[#2A2A2A]"
                          title="Editar Produto"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(product.id)}
                          disabled={!product.isAvailable}
                          className="text-zinc-400 hover:text-red-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed p-2 rounded-lg hover:bg-[#2A2A2A]"
                          title="Inativar Produto"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ProductFormModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={fetchProducts}
        product={selectedProduct}
      />
    </div>
  );
}
