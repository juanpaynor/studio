-- COMPLETE RESTART - Simple sales system that actually works
-- Drop everything and start completely fresh

-- Drop all functions
DROP FUNCTION IF EXISTS create_order_with_sale CASCADE;
DROP FUNCTION IF EXISTS get_sales_report CASCADE;
DROP FUNCTION IF EXISTS mark_receipt_printed CASCADE;
DROP FUNCTION IF EXISTS generate_receipt_number CASCADE;

-- Drop all sales tables
DROP TABLE IF EXISTS sales_items CASCADE;
DROP TABLE IF EXISTS sales CASCADE;

-- Create the simplest possible sales table
CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_number TEXT UNIQUE NOT NULL,
    order_id UUID REFERENCES orders(id),
    customer TEXT NOT NULL,
    sale_date TIMESTAMPTZ DEFAULT NOW(),
    subtotal NUMERIC(10,2) NOT NULL,
    total NUMERIC(10,2) NOT NULL,
    payment_type payment_method NOT NULL,
    amount_paid NUMERIC(10,2),
    change_amount NUMERIC(10,2),
    cashier UUID REFERENCES profiles(id),
    printed BOOLEAN DEFAULT FALSE,
    receipt_json JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create simple sales items table  
CREATE TABLE sales_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    name TEXT NOT NULL,
    category TEXT,
    qty INTEGER NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    total NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Simple receipt number function
CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS TEXT AS $$
DECLARE
    today TEXT;
    next_num INTEGER;
BEGIN
    today := TO_CHAR(NOW(), 'YYYYMMDD');
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(receipt_number FROM 13) AS INTEGER)), 0) + 1
    INTO next_num
    FROM sales
    WHERE receipt_number LIKE 'MSC-' || today || '-%';
    
    RETURN 'MSC-' || today || '-' || LPAD(next_num::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Super simple create order function with DIFFERENT parameter names
CREATE OR REPLACE FUNCTION create_order_with_sale(
    p_customer TEXT,
    p_items JSONB,
    p_payment payment_method,
    p_tendered NUMERIC DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_order_id UUID;
    v_sale_id UUID;
    v_order_num TEXT;
    v_receipt_num TEXT;
    v_item JSONB;
    v_product RECORD;
    v_subtotal NUMERIC := 0;
    v_total NUMERIC;
    v_change NUMERIC := 0;
    v_items JSONB;
BEGIN
    -- Generate numbers
    SELECT generate_order_number() INTO v_order_num;
    SELECT generate_receipt_number() INTO v_receipt_num;
    
    -- Create order
    INSERT INTO orders (order_number, customer_name, subtotal, tax_amount, total, created_by)
    VALUES (v_order_num, p_customer, 0, 0, 0, auth.uid())
    RETURNING id INTO v_order_id;
    
    -- Process all items in one go and calculate total
    WITH item_data AS (
        SELECT 
            jsonb_array_elements(p_items) as item
    ),
    products_data AS (
        SELECT 
            p.id,
            p.name,
            p.price,
            p.category,
            (i.item->>'quantity')::INTEGER as quantity,
            p.price * (i.item->>'quantity')::INTEGER as line_total
        FROM item_data i
        JOIN products p ON p.id = (i.item->>'product_id')::UUID
        WHERE p.is_available = true
    )
    INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, subtotal)
    SELECT v_order_id, id, name, price, quantity, line_total
    FROM products_data
    RETURNING SUM(subtotal) INTO v_subtotal;
    
    -- If no subtotal returned, calculate it
    IF v_subtotal IS NULL THEN
        SELECT COALESCE(SUM(subtotal), 0) INTO v_subtotal FROM order_items WHERE order_id = v_order_id;
    END IF;
    
    v_total := v_subtotal;
    
    -- Update order totals
    UPDATE orders SET subtotal = v_subtotal, total = v_total WHERE id = v_order_id;
    
    -- Calculate change
    IF p_payment = 'cash' AND p_tendered IS NOT NULL THEN
        v_change := p_tendered - v_total;
        IF v_change < 0 THEN
            RAISE EXCEPTION 'Not enough money: % for %', p_tendered, v_total;
        END IF;
    END IF;
    
    -- Create transaction
    INSERT INTO transactions (order_id, payment_method, amount_tendered, change_given, processed_by)
    VALUES (v_order_id, p_payment, p_tendered, CASE WHEN p_payment = 'cash' THEN v_change ELSE NULL END, auth.uid());
    
    -- Create sale
    INSERT INTO sales (receipt_number, order_id, customer, subtotal, total, payment_type, amount_paid, change_amount, cashier)
    VALUES (v_receipt_num, v_order_id, p_customer, v_subtotal, v_total, p_payment, p_tendered, CASE WHEN p_payment = 'cash' THEN v_change ELSE NULL END, auth.uid())
    RETURNING id INTO v_sale_id;
    
    -- Create all sale items in one go
    WITH item_data AS (
        SELECT jsonb_array_elements(p_items) as item
    )
    INSERT INTO sales_items (sale_id, product_id, name, category, qty, price, total)
    SELECT 
        v_sale_id,
        p.id,
        p.name,
        p.category,
        (i.item->>'quantity')::INTEGER,
        p.price,
        p.price * (i.item->>'quantity')::INTEGER
    FROM item_data i
    JOIN products p ON p.id = (i.item->>'product_id')::UUID;
    
    -- Build items array for receipt
    SELECT jsonb_agg(
        jsonb_build_object(
            'name', name,
            'quantity', qty,
            'price', price,
            'total', total
        ) ORDER BY created_at
    ) INTO v_items
    FROM sales_items
    WHERE sale_id = v_sale_id;
    
    -- Update with receipt data
    UPDATE sales SET receipt_json = jsonb_build_object(
        'receipt_number', v_receipt_num,
        'order_number', v_order_num,
        'customer_name', p_customer,
        'sale_date', NOW(),
        'subtotal', v_subtotal,
        'total', v_total,
        'payment_method', p_payment,
        'amount_tendered', p_tendered,
        'change_given', v_change,
        'items', v_items
    ) WHERE id = v_sale_id;
    
    -- Return result with all data
    RETURN jsonb_build_object(
        'order_id', v_order_id,
        'order_number', v_order_num,
        'sale_id', v_sale_id,
        'receipt_number', v_receipt_num,
        'receipt_data', jsonb_build_object(
            'receipt_number', v_receipt_num,
            'order_number', v_order_num,
            'customer_name', p_customer,
            'sale_date', NOW(),
            'subtotal', v_subtotal,
            'total', v_total,
            'payment_method', p_payment,
            'amount_tendered', p_tendered,
            'change_given', v_change,
            'items', v_items
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mark printed function
CREATE OR REPLACE FUNCTION mark_receipt_printed(p_sale_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE sales SET printed = TRUE WHERE id = p_sale_id;
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Indexes
CREATE INDEX idx_sales_receipt ON sales(receipt_number);
CREATE INDEX idx_sales_date ON sales(sale_date);
CREATE INDEX idx_sales_items_sale ON sales_items(sale_id);

-- RLS
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sales_select" ON sales FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "sales_insert" ON sales FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "sales_update" ON sales FOR UPDATE USING (cashier = auth.uid());

CREATE POLICY "sales_items_select" ON sales_items FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "sales_items_insert" ON sales_items FOR INSERT WITH CHECK (auth.role() = 'authenticated');