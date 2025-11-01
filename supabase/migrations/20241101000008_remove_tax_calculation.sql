-- Remove tax calculation from orders
-- Update the create_order function to remove tax calculations

CREATE OR REPLACE FUNCTION create_order(
    customer_name TEXT,
    items JSONB, -- Array of {product_id, quantity}
    payment_method payment_method,
    amount_tendered DECIMAL DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    order_id UUID;
    order_num TEXT;
    item JSONB;
    product_record RECORD;
    order_subtotal DECIMAL := 0;
    order_total DECIMAL;
    transaction_id UUID;
    change_amount DECIMAL := 0;
BEGIN
    -- Generate order number
    SELECT generate_order_number() INTO order_num;
    
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
    
    -- Update order totals (tax_amount set to 0)
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
    
    RETURN order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;