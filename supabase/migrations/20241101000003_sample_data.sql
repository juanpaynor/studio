-- Insert sample products for testing
INSERT INTO products (name, description, price, category, is_available) VALUES
-- Sandwiches
('The Classic', 'Classic grilled cheese with cheddar on sourdough bread', 189.99, 'Sandwiches', true),
('Bacon Bliss', 'Grilled cheese with crispy bacon and swiss cheese', 229.99, 'Sandwiches', true),
('Jalapeño Popper', 'Spicy grilled cheese with jalapeños and cream cheese', 209.99, 'Sandwiches', true),
('Veggie Delight', 'Grilled cheese with tomatoes, spinach, and avocado', 199.49, 'Sandwiches', true),

-- Sides
('Tomato Soup', 'Creamy tomato soup perfect with grilled cheese', 95.50, 'Sides', true),
('French Fries', 'Crispy golden french fries', 75.50, 'Sides', true),
('Onion Rings', 'Beer-battered onion rings', 85.00, 'Sides', true),
('Mozzarella Sticks', 'Breaded mozzarella sticks with marinara sauce', 115.50, 'Sides', true),

-- Drinks
('Cola', 'Classic cola soft drink', 55.50, 'Drinks', true),
('Lemonade', 'Fresh squeezed lemonade', 65.00, 'Drinks', true),
('Water', 'Bottled water', 35.00, 'Drinks', true),
('Iced Tea', 'Refreshing iced tea', 59.75, 'Drinks', true);

-- Create a sample admin user profile (you'll need to create the auth user first)
-- This is just the profile part - the auth user must be created through Supabase Auth
-- INSERT INTO profiles (id, email, full_name, role) VALUES
-- ('your-auth-user-id-here', 'admin@mscheesy.com', 'Admin User', 'admin');

-- Create functions for common operations

-- Function to generate next order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
    next_num INTEGER;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 2) AS INTEGER)), 0) + 1
    INTO next_num
    FROM orders
    WHERE order_number ~ '^#[0-9]+$';
    
    RETURN '#' || LPAD(next_num::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

-- Function to create complete order
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
    tax_rate DECIMAL := 0.08;
    order_tax DECIMAL;
    order_total DECIMAL;
    transaction_id UUID;
    change_amount DECIMAL := 0;
BEGIN
    -- Generate order number
    SELECT generate_order_number() INTO order_num;
    
    -- Create order
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
    
    -- Calculate tax and total
    order_tax := order_subtotal * tax_rate;
    order_total := order_subtotal + order_tax;
    
    -- Update order totals
    UPDATE orders 
    SET subtotal = order_subtotal, tax_amount = order_tax, total = order_total
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

-- Function to update order status
CREATE OR REPLACE FUNCTION update_order_status(
    order_id UUID,
    new_status order_status,
    kitchen_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE orders 
    SET 
        status = new_status,
        kitchen_notes = COALESCE(kitchen_notes, orders.kitchen_notes),
        updated_at = NOW()
    WHERE id = order_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;