-- Drop existing sales tables and recreate them properly
-- This starts fresh with a clean sales recording system

-- Drop existing functions first
DROP FUNCTION IF EXISTS create_order_with_sale(TEXT, JSONB, payment_method, DECIMAL);
DROP FUNCTION IF EXISTS get_sales_report(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE, UUID);
DROP FUNCTION IF EXISTS mark_receipt_printed(UUID);
DROP FUNCTION IF EXISTS generate_receipt_number();

-- Drop existing sales tables
DROP TABLE IF EXISTS sales_items CASCADE;
DROP TABLE IF EXISTS sales CASCADE;

-- Create clean sales table
CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_number TEXT UNIQUE NOT NULL,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    sale_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    total DECIMAL(10,2) NOT NULL DEFAULT 0,
    payment_method payment_method NOT NULL,
    amount_tendered DECIMAL(10,2),
    change_given DECIMAL(10,2),
    cashier_id UUID REFERENCES profiles(id),
    receipt_printed BOOLEAN DEFAULT FALSE,
    receipt_data JSONB,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create clean sales_items table
CREATE TABLE sales_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    product_name TEXT NOT NULL,
    product_category TEXT,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    line_total DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_sales_receipt_number ON sales(receipt_number);
CREATE INDEX idx_sales_date ON sales(sale_date);
CREATE INDEX idx_sales_cashier ON sales(cashier_id);
CREATE INDEX idx_sales_payment_method ON sales(payment_method);
CREATE INDEX idx_sales_items_sale_id ON sales_items(sale_id);
CREATE INDEX idx_sales_items_product_id ON sales_items(product_id);

-- Receipt number generator
CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS TEXT AS $$
DECLARE
    next_num INTEGER;
    date_str TEXT;
BEGIN
    date_str := TO_CHAR(NOW(), 'YYYYMMDD');
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(receipt_number FROM 13) AS INTEGER)), 0) + 1
    INTO next_num
    FROM sales
    WHERE receipt_number LIKE 'MSC-' || date_str || '-%';
    
    RETURN 'MSC-' || date_str || '-' || LPAD(next_num::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Simple create order with sale function
CREATE OR REPLACE FUNCTION create_order_with_sale(
    customer_name TEXT,
    items JSONB,
    payment_method payment_method,
    amount_tendered DECIMAL DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    new_order_id UUID;
    new_sale_id UUID;
    order_num TEXT;
    receipt_num TEXT;
    item JSONB;
    product_record RECORD;
    order_subtotal DECIMAL := 0;
    order_total DECIMAL;
    change_amount DECIMAL := 0;
    receipt_items JSONB;
BEGIN
    -- Generate numbers
    SELECT generate_order_number() INTO order_num;
    SELECT generate_receipt_number() INTO receipt_num;
    
    -- Create order
    INSERT INTO orders (order_number, customer_name, subtotal, tax_amount, total, created_by)
    VALUES (order_num, customer_name, 0, 0, 0, auth.uid())
    RETURNING id INTO new_order_id;
    
    -- Process items and calculate total
    FOR item IN SELECT * FROM jsonb_array_elements(items)
    LOOP
        SELECT * INTO product_record 
        FROM products 
        WHERE id = (item->>'product_id')::UUID AND is_available = true;
        
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Product not found: %', item->>'product_id';
        END IF;
        
        -- Add to order items
        INSERT INTO order_items (
            order_id, 
            product_id, 
            product_name, 
            product_price, 
            quantity, 
            subtotal
        ) VALUES (
            new_order_id,
            product_record.id,
            product_record.name,
            product_record.price,
            (item->>'quantity')::INTEGER,
            product_record.price * (item->>'quantity')::INTEGER
        );
        
        order_subtotal := order_subtotal + (product_record.price * (item->>'quantity')::INTEGER);
    END LOOP;
    
    order_total := order_subtotal;
    
    -- Update order total
    UPDATE orders 
    SET subtotal = order_subtotal, total = order_total
    WHERE id = new_order_id;
    
    -- Calculate change
    IF payment_method = 'cash' AND amount_tendered IS NOT NULL THEN
        change_amount := amount_tendered - order_total;
        IF change_amount < 0 THEN
            RAISE EXCEPTION 'Insufficient payment: % for total %', amount_tendered, order_total;
        END IF;
    END IF;
    
    -- Create transaction record
    INSERT INTO transactions (
        order_id, 
        payment_method, 
        amount_tendered, 
        change_given, 
        processed_by
    ) VALUES (
        new_order_id, 
        payment_method, 
        amount_tendered, 
        CASE WHEN payment_method = 'cash' THEN change_amount ELSE NULL END,
        auth.uid()
    );
    
    -- Create sale record
    INSERT INTO sales (
        receipt_number,
        order_id,
        customer_name,
        subtotal,
        total,
        payment_method,
        amount_tendered,
        change_given,
        cashier_id
    ) VALUES (
        receipt_num,
        new_order_id,
        customer_name,
        order_subtotal,
        order_total,
        payment_method,
        amount_tendered,
        CASE WHEN payment_method = 'cash' THEN change_amount ELSE NULL END,
        auth.uid()
    ) RETURNING id INTO new_sale_id;
    
    -- Create sale items and build receipt items array
    receipt_items := '[]'::jsonb;
    FOR item IN SELECT * FROM jsonb_array_elements(items)
    LOOP
        SELECT * INTO product_record 
        FROM products 
        WHERE id = (item->>'product_id')::UUID;
        
        INSERT INTO sales_items (
            sale_id,
            product_id,
            product_name,
            product_category,
            quantity,
            unit_price,
            line_total
        ) VALUES (
            new_sale_id,
            product_record.id,
            product_record.name,
            product_record.category,
            (item->>'quantity')::INTEGER,
            product_record.price,
            product_record.price * (item->>'quantity')::INTEGER
        );
        
        -- Add to receipt items
        receipt_items := receipt_items || jsonb_build_object(
            'name', product_record.name,
            'quantity', (item->>'quantity')::INTEGER,
            'price', product_record.price,
            'total', product_record.price * (item->>'quantity')::INTEGER
        );
    END LOOP;
    
    -- Build receipt data
    UPDATE sales SET receipt_data = jsonb_build_object(
        'receipt_number', receipt_num,
        'order_number', order_num,
        'customer_name', customer_name,
        'sale_date', NOW(),
        'subtotal', order_subtotal,
        'total', order_total,
        'payment_method', payment_method,
        'amount_tendered', amount_tendered,
        'change_given', change_amount,
        'items', receipt_items
    ) WHERE id = new_sale_id;
    
    -- Return result
    RETURN jsonb_build_object(
        'order_id', new_order_id,
        'order_number', order_num,
        'sale_id', new_sale_id,
        'receipt_number', receipt_num,
        'receipt_data', jsonb_build_object(
            'receipt_number', receipt_num,
            'order_number', order_num,
            'customer_name', customer_name,
            'sale_date', NOW(),
            'subtotal', order_subtotal,
            'total', order_total,
            'payment_method', payment_method,
            'amount_tendered', amount_tendered,
            'change_given', change_amount,
            'items', receipt_items
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to mark receipt as printed
CREATE OR REPLACE FUNCTION mark_receipt_printed(sale_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE sales SET receipt_printed = TRUE WHERE id = sale_uuid;
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_items ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view sales" ON sales FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert sales" ON sales FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own sales" ON sales FOR UPDATE 
    USING (cashier_id = auth.uid());

CREATE POLICY "Users can view sales items" ON sales_items FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert sales items" ON sales_items FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');