-- Pedidos manuais: origem, forma de pagamento, valores congelados e auditoria financeira.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS source VARCHAR(20) DEFAULT 'ONLINE';
UPDATE orders SET source = 'ONLINE' WHERE source IS NULL;
ALTER TABLE orders ALTER COLUMN source SET NOT NULL;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) DEFAULT 'PIX';
UPDATE orders SET payment_method = 'PIX' WHERE payment_method IS NULL;
ALTER TABLE orders ALTER COLUMN payment_method SET NOT NULL;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS observation TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS change_for DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_fee DECIMAL(10,2) DEFAULT 0;
UPDATE orders SET delivery_fee = 0 WHERE delivery_fee IS NULL;
ALTER TABLE orders ALTER COLUMN delivery_fee SET NOT NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_confirmed_at TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_confirmed_by VARCHAR(255);

ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_price_snapshot DECIMAL(10,2);
UPDATE order_items oi
SET product_price_snapshot = p.price
FROM products p
WHERE oi.product_id = p.id AND oi.product_price_snapshot IS NULL;
ALTER TABLE order_items ALTER COLUMN product_price_snapshot SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_operational_visibility
    ON orders (source, payment_status, created_at);
