-- Dashboard administrativo: dados reais de preparo e histórico mínimo dos itens.
-- Não preenche pedidos antigos; eles ficam fora da média de preparo até possuírem transições reais.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS production_started_at TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS ready_at TIMESTAMP;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_name_snapshot VARCHAR(255);
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_orders_dashboard_period
    ON orders (created_at, payment_status, order_status);
