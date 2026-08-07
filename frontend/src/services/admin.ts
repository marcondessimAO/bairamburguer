import { fetchWithAuth } from './api';

export interface OrderItemDTO {
  id: number;
  product: {
    id: number;
    name: string;
    description: string;
    price: number;
    imageUrl: string;
    category: string;
  };
  quantity: number;
  subtotal: number;
  addonsSummary?: string;
  addonsTotal?: number;
  productNameSnapshot?: string;
  productPriceSnapshot?: number;
}

export interface OrderDTO {
  id: number;
  customerName: string;
  customerPhone: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: {
    id: number;
    name: string;
    deliveryFee: number;
  };
  items: OrderItemDTO[];
  totalAmount: number;
  orderStatus: string;
  paymentStatus: string;
  source?: 'ONLINE' | 'MANUAL';
  paymentMethod?: 'PIX' | 'DINHEIRO' | 'CARTAO';
  changeFor?: number;
  deliveryFee?: number;
  paymentSurcharge?: number;
  paymentConfirmedAt?: string;
  paymentConfirmedBy?: string;
  createdAt: string;
  observation?: string;
  notes?: string;
  customerNote?: string;
  orderNote?: string;
}

export interface ManualOrderItemPayload {
  product: number;
  quantity: number;
  addonIds: number[];
}

export interface ManualOrderPayload {
  customerName: string;
  customerPhone: string;
  deliveryMode: 'ENTREGA' | 'RETIRADA';
  street?: string;
  number?: string;
  complement?: string;
  neighborhoodName?: string;
  observation?: string;
  paymentMethod: 'DINHEIRO' | 'CARTAO';
  changeFor?: number;
  items: ManualOrderItemPayload[];
}

export interface ManualOrderOptionsDTO {
  neighborhoods: Array<{ id: number; name: string; deliveryFee: number }>;
}

export interface ProductDTO {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  isAvailable: boolean;
  isPromotion?: boolean;
  originalPrice?: number;
  category: {
    id: number;
    name: string;
  };
  addons?: AddonDTO[];
}

export interface AddonDTO {
  id: number;
  name: string;
  price: number;
  groupName: string;
  selectionType: 'SINGLE' | 'MULTIPLE';
  active: boolean;
  products?: { id: number; name: string }[];
}

export interface CategoryDTO {
  id: number;
  name: string;
  isActive: boolean;
}

export interface ProductPayloadDTO {
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  isAvailable: boolean;
  categoryId: number;
}

export const adminService = {
  // ... (keep earlier methods unchanged up to getCategories)
  getOrders: async (): Promise<OrderDTO[]> => {
    const response = await fetchWithAuth('/v1/admin/orders');
    if (!response.ok) {
      throw new Error('Falha ao buscar pedidos');
    }
    return response.json();
  },

  updateOrderStatus: async (id: number, status: string): Promise<OrderDTO> => {
    const response = await fetchWithAuth(`/v1/admin/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Falha ao atualizar o pedido');
    }
    return response.json();
  },

  getManualOrderOptions: async (): Promise<ManualOrderOptionsDTO> => {
    const response = await fetchWithAuth('/v1/admin/orders/manual/options');
    if (!response.ok) throw new Error(await readApiError(response, 'Falha ao carregar opcoes do pedido'));
    return response.json();
  },

  createManualOrder: async (payload: ManualOrderPayload): Promise<OrderDTO> => {
    const response = await fetchWithAuth('/v1/admin/orders/manual', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(await readApiError(response, 'Falha ao criar pedido manual'));
    return response.json();
  },

  markOrderAsPaid: async (id: number): Promise<OrderDTO> => {
    const response = await fetchWithAuth(`/v1/admin/orders/${id}/payment/paid`, { method: 'PATCH' });
    if (!response.ok) throw new Error(await readApiError(response, 'Falha ao confirmar pagamento'));
    return response.json();
  },

  // Products CRUD
  getProducts: async (): Promise<ProductDTO[]> => {
    const response = await fetchWithAuth('/v1/admin/products');
    if (!response.ok) throw new Error('Falha ao buscar produtos');
    return response.json();
  },

  getCategories: async (): Promise<CategoryDTO[]> => {
    const response = await fetchWithAuth('/v1/categories');
    if (!response.ok) throw new Error('Falha ao buscar categorias');
    return response.json();
  },

  createProduct: async (productData: FormData): Promise<ProductDTO> => {
    const response = await fetchWithAuth('/v1/admin/products', {
      method: 'POST',
      body: productData,
    });
    if (!response.ok) throw new Error('Falha ao criar produto');
    return response.json();
  },

  updateProduct: async (id: number, productData: FormData): Promise<ProductDTO> => {
    const response = await fetchWithAuth(`/v1/admin/products/${id}`, {
      method: 'PUT',
      body: productData,
    });
    if (!response.ok) throw new Error('Falha ao atualizar produto');
    return response.json();
  },

  deleteProduct: async (id: number): Promise<void> => {
    const response = await fetchWithAuth(`/v1/admin/products/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Falha ao inativar produto');
  },

  toggleProductActive: async (id: number, active: boolean): Promise<ProductDTO> => {
    const response = await fetchWithAuth(`/v1/admin/products/${id}/active`, {
      method: 'PATCH',
      body: JSON.stringify({ active })
    });
    if (!response.ok) throw new Error('Falha ao alterar status do produto');
    return response.json();
  },

  getStoreStatus: async () => {
    const baseUrl = '/api';
    const res = await fetch(`${baseUrl}/v1/settings/store/status`);
    return res.json();
  },

  toggleStoreStatus: async () => {
    const res = await fetchWithAuth('/v1/admin/settings/store/toggle', { method: 'POST' });
    if (!res.ok) throw new Error('Falha ao alternar status da loja');
    return res.json();
  },

  // Addons CRUD
  getAddons: async (): Promise<AddonDTO[]> => {
    const response = await fetchWithAuth('/v1/admin/addons');
    if (!response.ok) throw new Error('Falha ao buscar adicionais');
    return response.json();
  },

  createAddon: async (addonData: { name: string; price: number; groupName: string; selectionType: string; active?: boolean; productIds: number[] }): Promise<AddonDTO> => {
    const response = await fetchWithAuth('/v1/admin/addons', {
      method: 'POST',
      body: JSON.stringify(addonData)
    });
    if (!response.ok) throw new Error('Falha ao criar adicional');
    return response.json();
  },

  updateAddon: async (id: number, addonData: { name: string; price: number; groupName: string; selectionType: string; active?: boolean; productIds: number[] }): Promise<AddonDTO> => {
    const response = await fetchWithAuth(`/v1/admin/addons/${id}`, {
      method: 'PUT',
      body: JSON.stringify(addonData)
    });
    if (!response.ok) throw new Error('Falha ao atualizar adicional');
    return response.json();
  },

  toggleAddonActive: async (id: number, active: boolean): Promise<AddonDTO> => {
    const response = await fetchWithAuth(`/v1/admin/addons/${id}/active`, {
      method: 'PATCH',
      body: JSON.stringify({ active })
    });
    if (!response.ok) throw new Error('Falha ao alterar status do adicional');
    return response.json();
  }
};

async function readApiError(response: Response, fallback: string) {
  const raw = await response.text();
  if (!raw) return fallback;
  try {
    const body = JSON.parse(raw) as { detail?: string; message?: string; error?: string; error_message?: string };
    return body.detail || body.message || body.error_message || body.error || fallback;
  } catch {
    return raw;
  }
}
