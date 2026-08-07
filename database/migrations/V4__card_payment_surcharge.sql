-- Snapshot financeiro do acrescimo aplicado conforme a forma de pagamento.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_surcharge DECIMAL(10,2) DEFAULT 0;
UPDATE orders SET payment_surcharge = 0 WHERE payment_surcharge IS NULL;
ALTER TABLE orders ALTER COLUMN payment_surcharge SET NOT NULL;
