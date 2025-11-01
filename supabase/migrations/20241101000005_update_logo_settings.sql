-- Update existing settings with new logo URLs
UPDATE settings SET value = 'https://hmozgkvakanhxddmficm.supabase.co/storage/v1/object/public/Logos/logos.png' WHERE key = 'logo_url';

-- Insert or update login logo setting
INSERT INTO settings (key, value, type, description) VALUES
('login_logo_url', 'https://hmozgkvakanhxddmficm.supabase.co/storage/v1/object/public/Logos/ganda.png', 'image', 'Logo URL for the login screen')
ON CONFLICT (key) DO UPDATE SET 
    value = EXCLUDED.value,
    updated_at = NOW();