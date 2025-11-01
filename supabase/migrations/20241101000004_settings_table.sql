-- Add settings table for logo and other customizable options
CREATE TABLE settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  type TEXT DEFAULT 'text', -- text, image, boolean, number
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default logo settings
INSERT INTO settings (key, value, type, description) VALUES
('logo_url', 'https://hmozgkvakanhxddmficm.supabase.co/storage/v1/object/public/Logos/logos.png', 'image', 'Main logo URL for the application'),
('login_logo_url', 'https://hmozgkvakanhxddmficm.supabase.co/storage/v1/object/public/Logos/ganda.png', 'image', 'Logo URL for the login screen'),
('logo_alt', 'Ms. Cheesy Logo', 'text', 'Alt text for the logo'),
('business_name', 'Ms. Cheesy', 'text', 'Business name displayed in the application'),
('tagline', 'Point of Sale System', 'text', 'Tagline or subtitle for the business');

-- Enable RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Settings policies - only admins can manage settings
CREATE POLICY "Anyone can view settings" ON settings
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage settings" ON settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Create trigger for updated_at
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get setting value
CREATE OR REPLACE FUNCTION get_setting(setting_key TEXT)
RETURNS TEXT AS $$
DECLARE
    setting_value TEXT;
BEGIN
    SELECT value INTO setting_value
    FROM settings
    WHERE key = setting_key;
    
    RETURN setting_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update setting
CREATE OR REPLACE FUNCTION update_setting(setting_key TEXT, setting_value TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE settings 
    SET value = setting_value, updated_at = NOW()
    WHERE key = setting_key;
    
    IF NOT FOUND THEN
        INSERT INTO settings (key, value) VALUES (setting_key, setting_value);
    END IF;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;