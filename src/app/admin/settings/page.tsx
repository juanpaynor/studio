'use client';

import { useState } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save, Image as ImageIcon, Building } from 'lucide-react';
import Image from 'next/image';

export default function SettingsPage() {
  const { settings, updateSettings } = useSettings();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    business_name: settings.business_name || 'Ms. Cheesy POS',
    logo_url: settings.logo_url || '',
    logo_alt: settings.logo_alt || 'Logo',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await updateSettings(formData);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Manage your business settings and branding
          </p>
        </div>
      </div>

      {success && (
        <Alert>
          <AlertDescription>Settings saved successfully!</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Business Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Business Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="business-name">Business Name</Label>
              <Input
                id="business-name"
                value={formData.business_name}
                onChange={(e) => handleInputChange('business_name', e.target.value)}
                placeholder="Enter your business name"
              />
            </div>
          </CardContent>
        </Card>

        {/* Logo Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Logo Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="logo-url">Logo URL</Label>
              <Input
                id="logo-url"
                value={formData.logo_url}
                onChange={(e) => handleInputChange('logo_url', e.target.value)}
                placeholder="https://example.com/logo.png"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Enter a direct link to your logo image
              </p>
            </div>

            <div>
              <Label htmlFor="logo-alt">Logo Alt Text</Label>
              <Input
                id="logo-alt"
                value={formData.logo_alt}
                onChange={(e) => handleInputChange('logo_alt', e.target.value)}
                placeholder="Description of your logo"
              />
            </div>

            {/* Logo Preview */}
            {formData.logo_url && (
              <div>
                <Label>Logo Preview</Label>
                <div className="mt-2 p-4 border rounded-lg bg-muted/50 flex items-center justify-center">
                  <div className="h-16 w-16 relative">
                    <Image
                      src={formData.logo_url}
                      alt={formData.logo_alt}
                      fill
                      className="object-contain"
                      onError={() => setError('Invalid logo URL')}
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading} size="lg">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </>
          )}
        </Button>
      </div>

      {/* Login Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Login Screen Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center p-8 bg-muted/30 rounded-lg">
            {formData.logo_url ? (
              <div className="h-16 w-16 mb-4 relative">
                <Image
                  src={formData.logo_url}
                  alt={formData.logo_alt}
                  fill
                  className="object-contain"
                />
              </div>
            ) : (
              <div className="h-16 w-16 mb-4 bg-primary/20 rounded-lg flex items-center justify-center">
                <ImageIcon className="h-8 w-8 text-primary" />
              </div>
            )}
            <h1 className="font-headline text-3xl font-bold text-center">
              {formData.business_name}
            </h1>
            <p className="text-muted-foreground text-center mt-2">
              Point of Sale System
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}