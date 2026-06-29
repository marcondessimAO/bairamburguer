CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    category_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    CONSTRAINT fk_category
        FOREIGN KEY(category_id) 
        REFERENCES categories(id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS neighborhoods (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    delivery_fee DECIMAL(10,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS orders (
    id BIGSERIAL PRIMARY KEY,
    neighborhood_id INT NOT NULL,
    user_id INT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_status VARCHAR(50) DEFAULT 'PENDING',
    order_status VARCHAR(50) DEFAULT 'RCVD',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_neighborhood
        FOREIGN KEY(neighborhood_id) 
        REFERENCES neighborhoods(id),
    CONSTRAINT fk_user
        FOREIGN KEY(user_id)
        REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    order_id BIGINT UNIQUE NOT NULL,
    transaction_id VARCHAR(255),
    gateway_response JSONB,
    status VARCHAR(50),
    CONSTRAINT fk_order
        FOREIGN KEY(order_id) 
        REFERENCES orders(id)
        ON DELETE CASCADE
);

ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url VARCHAR(255);
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_promotion BOOLEAN DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS original_price NUMERIC(10,2);

CREATE TABLE IF NOT EXISTS addons (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    group_name VARCHAR(100) NOT NULL,
    selection_type VARCHAR(50) DEFAULT 'MULTIPLE',
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_addons (
    product_id INT NOT NULL,
    addon_id BIGINT NOT NULL,
    PRIMARY KEY (product_id, addon_id),
    CONSTRAINT fk_product_addons_product
        FOREIGN KEY(product_id) 
        REFERENCES products(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_product_addons_addon
        FOREIGN KEY(addon_id) 
        REFERENCES addons(id)
        ON DELETE CASCADE
);
