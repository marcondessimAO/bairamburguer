import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import { ProductFormModal } from './ProductFormModal';
import { adminService, type ProductDTO } from '@/services/admin';

vi.mock('@/services/admin', () => ({ adminService: {
  getCategories: vi.fn(), getAddons: vi.fn(), updateProduct: vi.fn(),
} }));

const product: ProductDTO = {
  id: 1, name: 'Bairam Cheddar', description: '', price: 20, imageUrl: '',
  isAvailable: true, category: { id: 1, name: 'Bairam Individuais' },
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(adminService.getCategories).mockResolvedValue([{ id: 1, name: 'Bairam Individuais', isActive: true }]);
  vi.mocked(adminService.getAddons).mockResolvedValue([]);
  vi.mocked(adminService.updateProduct).mockResolvedValue(product);
});

it('saves an editable minimum quantity and promotional unit price for one product', async () => {
  const user = userEvent.setup();
  render(<ProductFormModal isOpen product={product} onClose={vi.fn()} onSave={vi.fn()} />);
  await screen.findByRole('option', { name: 'Bairam Individuais' });
  await user.click(screen.getByRole('checkbox', { name: 'Promoção por quantidade' }));
  const minimum = screen.getByLabelText('A partir de quantas unidades');
  await user.clear(minimum);
  await user.type(minimum, '4');
  await user.type(screen.getByLabelText('Preço promocional por unidade (R$)'), '15');
  await user.click(screen.getByRole('button', { name: 'Salvar Produto' }));
  await waitFor(() => expect(adminService.updateProduct).toHaveBeenCalledOnce());
  const [id, form] = vi.mocked(adminService.updateProduct).mock.calls[0];
  expect(id).toBe(1);
  expect(JSON.parse(form.get('product') as string)).toMatchObject({
    quantityPromotionMin: 4, quantityPromotionPrice: 15,
  });
});

it('loads an existing promotion and sends nulls when the admin disables it', async () => {
  const user = userEvent.setup();
  render(<ProductFormModal isOpen product={{ ...product, quantityPromotionMin: 3, quantityPromotionPrice: 15 }} onClose={vi.fn()} onSave={vi.fn()} />);
  await screen.findByRole('option', { name: 'Bairam Individuais' });
  expect(screen.getByLabelText('A partir de quantas unidades')).toHaveValue(3);
  expect(screen.getByLabelText('Preço promocional por unidade (R$)')).toHaveValue(15);
  await user.click(screen.getByRole('checkbox', { name: 'Promoção por quantidade' }));
  await user.click(screen.getByRole('button', { name: 'Salvar Produto' }));
  await waitFor(() => expect(adminService.updateProduct).toHaveBeenCalledOnce());
  const form = vi.mocked(adminService.updateProduct).mock.calls[0][1];
  expect(JSON.parse(form.get('product') as string)).toMatchObject({
    quantityPromotionMin: null, quantityPromotionPrice: null,
  });
});
