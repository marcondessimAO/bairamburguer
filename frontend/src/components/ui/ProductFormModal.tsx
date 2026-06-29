"use client";

import { useState, useEffect, useRef } from 'react';
import { adminService, ProductDTO, CategoryDTO, AddonDTO } from '@/services/admin';
import { X, UploadCloud, Save } from 'lucide-react';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  product: ProductDTO | null;
}

export function ProductFormModal({ isOpen, onClose, onSave, product }: ProductFormModalProps) {
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState(true);
  const [isPromotion, setIsPromotion] = useState(false);
  const [originalPrice, setOriginalPrice] = useState('');
  const [addonsList, setAddonsList] = useState<AddonDTO[]>([]);
  const [selectedAddons, setSelectedAddons] = useState<number[]>([]);

  useEffect(() => {
    if (isOpen) {
      if (categories.length === 0) {
        adminService.getCategories()
          .then(setCategories)
          .catch(err => console.error('Erro ao carregar categorias', err));
      }
      adminService.getAddons()
        .then(setAddonsList)
        .catch(err => console.error('Erro ao carregar adicionais', err));
    }
  }, [isOpen, categories.length]);

  useEffect(() => {
    const syncForm = () => {
    if (product) {
      setName(product.name);
      setDescription(product.description || '');
      setPrice(product.price.toString());
      setCategoryId(product.category?.id?.toString() || '');
      setIsAvailable(product.isAvailable);
      setIsPromotion(product.isPromotion || false);
      setOriginalPrice(product.originalPrice?.toString() || '');
      setImagePreview(product.imageUrl || null);
      setImageFile(null);
      setSelectedAddons(product.addons?.map(a => a.id) || []);
    } else {
      setName('');
      setDescription('');
      setPrice('');
      setCategoryId('');
      setIsAvailable(true);
      setIsPromotion(false);
      setOriginalPrice('');
      setImagePreview(null);
      setImageFile(null);
      setSelectedAddons([]);
    }
    };

    queueMicrotask(syncForm);
  }, [product]);

  const handleClose = () => {
    onClose();
    if (!product) {
      setName('');
      setDescription('');
      setPrice('');
      setCategoryId('');
      setIsAvailable(true);
      setIsPromotion(false);
      setImagePreview(null);
      setImageFile(null);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      const formData = new FormData();
      const productPayload = {
        name,
        description,
        price,
        categoryId: parseInt(categoryId, 10),
        isAvailable,
        isPromotion,
        originalPrice: originalPrice ? parseFloat(originalPrice.replace(',', '.')) : null,
        addonIds: selectedAddons
      };
      
      formData.append('product', JSON.stringify(productPayload));
      
      if (imageFile) {
        formData.append('image', imageFile);
      }

      if (product?.id) {
        await adminService.updateProduct(product.id, formData);
      } else {
        await adminService.createProduct(formData);
      }
      
      onSave();
      handleClose();
    } catch (err) {
      alert('Erro ao salvar produto');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1E1E1E] rounded-2xl border border-zinc-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center p-6 border-b border-zinc-800 sticky top-0 bg-[#1E1E1E] z-10">
          <h2 className="text-xl font-bold text-zinc-100">
            {product ? 'Editar Produto' : 'Novo Produto'}
          </h2>
          <button onClick={handleClose} className="text-zinc-400 hover:text-zinc-100 p-2 rounded-full hover:bg-zinc-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-zinc-400">Nome do Produto</label>
              <input
                required
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-[#121212] border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-[#F1C40F] transition-colors"
                placeholder="Ex: Hambúrguer Clássico"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-zinc-400">Preço (R$)</label>
              <input
                required
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={e => setPrice(e.target.value)}
                className="w-full bg-[#121212] border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-[#F1C40F] transition-colors"
                placeholder="Ex: 25.90"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-zinc-400">Preço Original (Opcional)</label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-zinc-500">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={originalPrice}
                  onChange={e => setOriginalPrice(e.target.value)}
                  className="w-full bg-[#121212] border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-zinc-100 focus:outline-none focus:border-[#F1C40F] transition-colors"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-medium text-zinc-400">Categoria</label>
              <select
                required
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                className="w-full bg-[#121212] border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-[#F1C40F] transition-colors"
              >
                <option value="">Selecione uma categoria...</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-medium text-zinc-400">Descrição</label>
              <textarea
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full bg-[#121212] border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-[#F1C40F] transition-colors resize-none"
                placeholder="Descreva os ingredientes..."
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-medium text-zinc-400">Imagem do Produto</label>
              <input 
                type="file" 
                accept="image/*" 
                ref={fileInputRef} 
                onChange={handleImageChange} 
                className="hidden" 
              />
              
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-zinc-800 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-[#F1C40F] hover:bg-[#121212] transition-colors"
              >
                {imagePreview ? (
                  <div className="relative w-32 h-32 rounded-xl overflow-hidden border border-zinc-800">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-zinc-500">
                    <UploadCloud className="w-10 h-10 mb-2" />
                    <span className="text-sm font-medium">Clique para fazer upload</span>
                    <span className="text-xs mt-1">PNG, JPG até 5MB</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3 md:col-span-2 bg-[#121212] p-4 rounded-xl border border-zinc-800">
              <label className="block text-sm font-semibold text-zinc-300">Vincular Adicionais/Complementos</label>
              {addonsList.length === 0 ? (
                <p className="text-zinc-500 text-xs">Nenhum adicional cadastrado.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-40 overflow-y-auto pr-2 mt-2">
                  {addonsList.map(addon => (
                    <label key={addon.id} className="flex items-center space-x-3 cursor-pointer p-2 rounded hover:bg-zinc-800/50 transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedAddons.includes(addon.id)}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedAddons([...selectedAddons, addon.id]);
                          } else {
                            setSelectedAddons(selectedAddons.filter(id => id !== addon.id));
                          }
                        }}
                        className="w-4 h-4 rounded border-zinc-700 text-[#F1C40F] focus:ring-[#F1C40F] focus:ring-offset-[#1E1E1E] bg-[#1E1E1E]"
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-zinc-300">{addon.name}</span>
                        <span className="text-xs text-zinc-500">{addon.groupName} • R$ {addon.price.toFixed(2)}</span>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
            
            <div className="space-y-4 md:col-span-2 mt-2 bg-[#121212] p-4 rounded-xl border border-zinc-800">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAvailable}
                  onChange={e => setIsAvailable(e.target.checked)}
                  className="w-5 h-5 rounded border-zinc-700 text-[#F1C40F] focus:ring-[#F1C40F] focus:ring-offset-[#1E1E1E] bg-[#1E1E1E]"
                />
                <span className="text-sm font-medium text-zinc-300">Produto Ativo (Disponível para venda)</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPromotion}
                  onChange={e => setIsPromotion(e.target.checked)}
                  className="w-5 h-5 rounded border-zinc-700 text-[#F1C40F] focus:ring-[#F1C40F] focus:ring-offset-[#1E1E1E] bg-[#1E1E1E]"
                />
                <span className="text-sm font-medium text-zinc-300">Em Promoção (Destaque visual na loja)</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t border-zinc-800">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2.5 rounded-xl font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl font-bold bg-[#F1C40F] text-black hover:bg-[#F39C12] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? 'A salvar...' : (
                <>
                  <Save className="w-5 h-5" /> Salvar Produto
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
