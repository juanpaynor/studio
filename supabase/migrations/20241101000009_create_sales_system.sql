-- Create sales tracking system with receipts
-- This migration adds proper sales recording functionality

-- Create sales table to track all sales transactions
CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_number TEXT UNIQUE NOT NULL,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    sale_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    total DECIMAL(10,2) NOT NULL DEFAULT 0,
    payment_method payment_method NOT NULL,
    amount_tendered DECIMAL(10,2),
    change_given DECIMAL(10,2),
    cashier_id UUID REFERENCES profiles(id),
    receipt_printed BOOLEAN DEFAULT FALSE,
    receipt_data JSONB, -- Store receipt content for reprinting
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sales_items table to track individual items in each sale
CREATE TABLE IF NOT EXISTS sales_items (
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sales_receipt_number ON sales(receipt_number);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_cashier ON sales(cashier_id);
CREATE INDEX IF NOT EXISTS idx_sales_payment_method ON sales(payment_method);
CREATE INDEX IF NOT EXISTS idx_sales_items_sale_id ON sales_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sales_items_product_id ON sales_items(product_id);

-- Function to generate receipt numbers
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

-- Updated create_order function that also creates a sale record
CREATE OR REPLACE FUNCTION create_order_with_sale(
    customer_name TEXT,
    items JSONB, -- Array of {product_id, quantity}
    payment_method payment_method,
    amount_tendered DECIMAL DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    order_id UUID;
    sale_id UUID;
    order_num TEXT;
    receipt_num TEXT;
    item JSONB;
    product_record RECORD;
    order_subtotal DECIMAL := 0;
    order_total DECIMAL;
    transaction_id UUID;
    change_amount DECIMAL := 0;
    receipt_data JSONB;
BEGIN
    -- Generate order and receipt numbers
    SELECT generate_order_number() INTO order_num;
    SELECT generate_receipt_number() INTO receipt_num;
    
    -- Create order (no tax calculation)
    INSERT INTO orders (order_number, customer_name, subtotal, tax_amount, total, created_by)
    VALUES (order_num, customer_name, 0, 0, 0, auth.uid())
    RETURNING id INTO order_id;
    
    -- Process each item
    FOR item IN SELECT * FROM jsonb_array_elements(items)
    LOOP
        -- Get product details
        SELECT * INTO product_record 
        FROM products 
        WHERE id = (item->>'product_id')::UUID AND is_available = true;
        
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Product not found or unavailable: %', item->>'product_id';
        END IF;
        
        -- Insert order item
        INSERT INTO order_items (
            order_id, 
            product_id, 
            product_name, 
            product_price, 
            quantity, 
            subtotal
        ) VALUES (
            order_id,
            product_record.id,
            product_record.name,
            product_record.price,
            (item->>'quantity')::INTEGER,
            product_record.price * (item->>'quantity')::INTEGER
        );
        
        -- Add to order subtotal
        order_subtotal := order_subtotal + (product_record.price * (item->>'quantity')::INTEGER);
    END LOOP;
    
    -- Total equals subtotal (no tax)
    order_total := order_subtotal;
    
    -- Update order totals
    UPDATE orders 
    SET subtotal = order_subtotal, tax_amount = 0, total = order_total
    WHERE id = order_id;
    
    -- Calculate change for cash payments
    IF payment_method = 'cash' AND amount_tendered IS NOT NULL THEN
        change_amount := amount_tendered - order_total;
        IF change_amount < 0 THEN
            RAISE EXCEPTION 'Insufficient payment: tendered % for total %', amount_tendered, order_total;
        END IF;
    END IF;
    
    -- Create transaction
    INSERT INTO transactions (
        order_id, 
        payment_method, 
        amount_tendered, 
        change_given, 
        processed_by
    ) VALUES (
        order_id, 
        payment_method, 
        amount_tendered, 
        CASE WHEN payment_method = 'cash' THEN change_amount ELSE NULL END,
        auth.uid()
    ) RETURNING id INTO transaction_id;
    
    -- Create sale record
    INSERT INTO sales (
        receipt_number,
        order_id,
        customer_name,
        subtotal,
        tax_amount,
        total,
        payment_method,
        amount_tendered,
        change_given,
        cashier_id
    ) VALUES (
        receipt_num,
        order_id,
        customer_name,
        order_subtotal,
        0, -- No tax
        order_total,
        payment_method,
        amount_tendered,
        CASE WHEN payment_method = 'cash' THEN change_amount ELSE NULL END,
        auth.uid()
    ) RETURNING id INTO sale_id;
    
    -- Create sale items
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
            sale_id,
            product_record.id,
            product_record.name,
            product_record.category,
            (item->>'quantity')::INTEGER,
            product_record.price,
            product_record.price * (item->>'quantity')::INTEGER
        );
    END LOOP;
    
    -- Prepare receipt data
    receipt_data := jsonb_build_object(
        'receipt_number', receipt_num,
        'order_number', order_num,
        'customer_name', customer_name,
        'sale_date', NOW(),
        'subtotal', order_subtotal,
        'total', order_total,
        'payment_method', payment_method,
        'amount_tendered', amount_tendered,
        'change_given', change_amount,
        'items', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'name', si.product_name,
                    'quantity', si.quantity,
                    'price', si.unit_price,
                    'total', si.line_total
                )
            ) FROM sales_items si WHERE si.sale_id = create_order_with_sale.sale_id
        )
    );
    
    -- Update sale with receipt data
    UPDATE sales SET receipt_data = receipt_data WHERE id = sale_id;
    
    -- Return both order and sale information
    RETURN jsonb_build_object(
        'order_id', order_id,
        'order_number', order_num,
        'sale_id', sale_id,
        'receipt_number', receipt_num,
        'receipt_data', receipt_data
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get sales data for reporting
CREATE OR REPLACE FUNCTION get_sales_report(
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    cashier_id UUID DEFAULT NULL
)
RETURNS TABLE (
    sale_id UUID,
    receipt_number TEXT,
    customer_name TEXT,
    sale_date TIMESTAMP WITH TIME ZONE,
    subtotal DECIMAL,
    total DECIMAL,
    payment_method payment_method,
    cashier_name TEXT,
    items_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.receipt_number,
        s.customer_name,
        s.sale_date,
        s.subtotal,
        s.total,
        s.payment_method,
        COALESCE(p.full_name, p.email) as cashier_name,
        COUNT(si.id)::INTEGER as items_count
    FROM sales s
    LEFT JOIN profiles p ON s.cashier_id = p.id
    LEFT JOIN sales_items si ON s.id = si.sale_id
    WHERE 
        (start_date IS NULL OR s.sale_date >= start_date) AND
        (end_date IS NULL OR s.sale_date <= end_date) AND
        (get_sales_report.cashier_id IS NULL OR s.cashier_id = get_sales_report.cashier_id)
    GROUP BY s.id, s.receipt_number, s.customer_name, s.sale_date, s.subtotal, s.total, s.payment_method, p.full_name, p.email
    ORDER BY s.sale_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark receipt as printed
CREATE OR REPLACE FUNCTION mark_receipt_printed(sale_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE sales SET receipt_printed = TRUE WHERE id = sale_id;
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS policies for sales tables
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_items ENABLE ROW LEVEL SECURITY;

-- Sales policies
CREATE POLICY "Users can view sales" ON sales FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert sales" ON sales FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own sales" ON sales FOR UPDATE 
    USING (cashier_id = auth.uid());

-- Sales items policies
CREATE POLICY "Users can view sales items" ON sales_items FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert sales items" ON sales_items FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');