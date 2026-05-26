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
}

export interface OrderDTO {
  id: number;
  customerName: string;
  customerPhone: string;
  neighborhood: {
    id: number;
    name: string;
    deliveryFee: number;
  };
  items: OrderItemDTO[];
  totalAmount: number;
  orderStatus: string;
  paymentStatus: string;
  createdAt: string;
}

export interface ProductDTO {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  isAvailable: boolean;
  category: {
    id: number;
    name: string;
  };
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
      throw new Error('Falha ao atualizar o pedido');
    }
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

  getStoreStatus: async () => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://2.25.131.139:8080/api';
    const res = await fetch(`${baseUrl}/v1/settings/store/status`);
    return res.json();
  },

  toggleStoreStatus: async () => {
    const res = await fetchWithAuth('/v1/admin/settings/store/toggle', { method: 'POST' });
    if (!res.ok) throw new Error('Falha ao alternar status da loja');
    return res.json();
  }
};
