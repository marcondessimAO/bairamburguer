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

export const adminService = {
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
  }
};
