"use client";

import { useEffect, useState } from 'react';
import { adminService, AddonDTO, ProductDTO } from '@/services/admin';
import { Plus, Edit2, X, Save } from 'lucide-react';

export default function AdminAddonsPage() {
  const [addons, setAddons] = useState<AddonDTO[]>([]);
  const [products, setProducts] = useState<ProductDTO[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddon, setEditingAddon] = useState<AddonDTO | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [groupName, setGroupName] = useState('');
  const [selectionType, setSelectionType] = useState<'SINGLE' | 'MULTIPLE'>('MULTIPLE');
  const [active, setActive] = useState(true);
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);

  const fetchAddons = async () => {
    try {
      const data = await adminService.getAddons();
      setAddons(data);
    } catch (err) {
      console.error('Erro ao buscar adicionais:', err);
    }
  };



  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const addonsData = await adminService.getAddons();
        const productsData = await adminService.getProducts();
        if (isMounted) {
          setAddons(addonsData);
          setProducts(productsData);
        }
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleOpenModal = (addon?: AddonDTO) => {
    if (addon) {
      setEditingAddon(addon);
      setName(addon.name);
      setPrice(addon.price.toString());
      setGroupName(addon.groupName);
      setSelectionType(addon.selectionType);
      setActive(addon.active);
      setSelectedProductIds(addon.products?.map(p => p.id) || []);
    } else {
      setEditingAddon(null);
      setName('');
      setPrice('');
      setGroupName('');
      setSelectionType('MULTIPLE');
      setActive(true);
      setSelectedProductIds([]);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAddon(null);
  };

  const handleToggleActive = async (id: number, currentActive: boolean) => {
    try {
      await adminService.toggleAddonActive(id, !currentActive);
      fetchAddons();
    } catch (err) {
      console.error('Erro ao alternar status do adicional:', err);
      alert('Erro ao alterar status do adicional.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name,
        price: parseFloat(price.replace(',', '.')),
        groupName,
        selectionType,
        active,
        productIds: selectedProductIds
      };

      if (editingAddon) {
        await adminService.updateAddon(editingAddon.id, payload);
      } else {
        await adminService.createAddon(payload);
      }

      fetchAddons();
      handleCloseModal();
    } catch (err) {
      alert('Erro ao salvar adicional.');
      console.error(err);
    }
  };

  const toggleProductSelection = (productId: number) => {
    if (selectedProductIds.includes(productId)) {
      setSelectedProductIds(selectedProductIds.filter(id => id !== productId));
    } else {
      setSelectedProductIds([...selectedProductIds, productId]);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-[#F1C40F] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-[#1E1E1E] p-6 rounded-2xl border border-zinc-800 shadow-lg">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Gestão de Adicionais</h1>
          <p className="text-zinc-400 text-sm mt-1">Crie, edite e vincule complementos e opcionais aos produtos</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-[#F1C40F] text-black px-4 py-2 rounded-xl font-bold hover:bg-[#F39C12] transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> Novo Adicional
        </button>
      </div>

      <div className="bg-[#1E1E1E] rounded-2xl border border-zinc-800 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 text-xs font-semibold uppercase tracking-wider bg-zinc-900/50">
                <th className="px-6 py-4">Nome</th>
                <th className="px-6 py-4">Grupo / Categoria</th>
                <th className="px-6 py-4">Preço</th>
                <th className="px-6 py-4">Seleção</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Produtos Vinculados</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50 text-sm text-zinc-300">
              {addons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-zinc-500">
                    Nenhum adicional cadastrado.
                  </td>
                </tr>
              ) : (
                addons.map((addon) => (
                  <tr key={addon.id} className="hover:bg-zinc-800/10 transition-colors">
                    <td className="px-6 py-4 font-medium text-zinc-100">{addon.name}</td>
                    <td className="px-6 py-4">
                      <span className="bg-zinc-800 text-zinc-300 px-2.5 py-1 rounded-lg text-xs font-medium border border-zinc-700/50">
                        {addon.groupName}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[#F1C40F] font-semibold">
                      R$ {addon.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-zinc-400">
                        {addon.selectionType === 'SINGLE' ? 'Escolha Única' : 'Múltipla Escolha'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleActive(addon.id, addon.active)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                          addon.active 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20' 
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20'
                        }`}
                      >
                        {addon.active ? 'Ativo' : 'Inativo'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs truncate text-xs text-zinc-400" title={addon.products?.map(p => p.name).join(', ')}>
                        {addon.products && addon.products.length > 0 
                          ? addon.products.map(p => p.name).join(', ') 
                          : 'Nenhum produto vinculado'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleOpenModal(addon)}
                        className="text-zinc-400 hover:text-[#F1C40F] p-1.5 rounded-lg hover:bg-zinc-800 transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Formulário */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1E1E1E] rounded-2xl border border-zinc-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-zinc-800 sticky top-0 bg-[#1E1E1E] z-10">
              <h2 className="text-xl font-bold text-zinc-100">
                {editingAddon ? 'Editar Adicional' : 'Novo Adicional'}
              </h2>
              <button onClick={handleCloseModal} className="text-zinc-400 hover:text-zinc-100 p-2 rounded-full hover:bg-zinc-800 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-zinc-400">Nome do Adicional</label>
                  <input
                    required
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-[#121212] border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-[#F1C40F] transition-colors"
                    placeholder="Ex: Coca-Cola, Cheddar Extra"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-zinc-400">Preço (R$)</label>
                  <input
                    required
                    type="text"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    className="w-full bg-[#121212] border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-[#F1C40F] transition-colors"
                    placeholder="Ex: 4,00"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-zinc-400">Grupo / Categoria do Adicional</label>
                  <input
                    required
                    type="text"
                    value={groupName}
                    onChange={e => setGroupName(e.target.value)}
                    className="w-full bg-[#121212] border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-[#F1C40F] transition-colors"
                    placeholder="Ex: Bebida, Acompanhamento"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-zinc-400">Tipo de Seleção</label>
                  <select
                    value={selectionType}
                    onChange={e => setSelectionType(e.target.value as 'SINGLE' | 'MULTIPLE')}
                    className="w-full bg-[#121212] border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-[#F1C40F] transition-colors"
                  >
                    <option value="SINGLE">Escolha Única (Radio Button)</option>
                    <option value="MULTIPLE">Múltipla Escolha (Checkbox)</option>
                  </select>
                </div>

                <div className="space-y-3 md:col-span-2 bg-[#121212] p-4 rounded-xl border border-zinc-800">
                  <label className="block text-sm font-semibold text-zinc-300">Vincular a Produtos</label>
                  {products.length === 0 ? (
                    <p className="text-zinc-500 text-xs">Nenhum produto cadastrado no cardápio.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-2 mt-2">
                      {products.map(product => (
                        <label key={product.id} className="flex items-center space-x-3 cursor-pointer p-2 rounded hover:bg-zinc-800/50 transition-colors">
                          <input
                            type="checkbox"
                            checked={selectedProductIds.includes(product.id)}
                            onChange={() => toggleProductSelection(product.id)}
                            className="w-4 h-4 rounded border-zinc-700 text-[#F1C40F] focus:ring-[#F1C40F] focus:ring-offset-[#1E1E1E] bg-[#1E1E1E]"
                          />
                          <span className="text-sm text-zinc-300">{product.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2 mt-2 bg-[#121212] p-4 rounded-xl border border-zinc-800">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={e => setActive(e.target.checked)}
                      className="w-5 h-5 rounded border-zinc-700 text-[#F1C40F] focus:ring-[#F1C40F] focus:ring-offset-[#1E1E1E] bg-[#1E1E1E]"
                    />
                    <span className="text-sm font-medium text-zinc-300">Adicional Ativo</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-6 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-2.5 rounded-xl font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl font-bold bg-[#F1C40F] text-black hover:bg-[#F39C12] transition-colors flex items-center gap-2"
                >
                  <Save className="w-5 h-5" /> Salvar Adicional
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
