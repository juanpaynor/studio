-- Fix the ambiguous column reference in create_order_with_sale function
-- This migration fixes the sale_id ambiguity issue

-- First, create the missing generate_order_number function
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
    next_num INTEGER;
    date_str TEXT;
BEGIN
    date_str := TO_CHAR(NOW(), 'YYYYMMDD');
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 5) AS INTEGER)), 0) + 1
    INTO next_num
    FROM orders
    WHERE order_number LIKE 'ORD-' || date_str || '-%';
    
    RETURN 'ORD-' || date_str || '-' || LPAD(next_num::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate the function with fixed column references
DROP FUNCTION IF EXISTS create_order_with_sale(TEXT, JSONB, payment_method, DECIMAL);

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
    
    -- Prepare receipt data with proper table aliases
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
            ) FROM sales_items si WHERE si.sale_id = sale_id
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