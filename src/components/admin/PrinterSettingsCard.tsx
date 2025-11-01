'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Printer, Check } from 'lucide-react';
import { getPrinterSettings, savePrinterSettings, type PrinterSettings, generateCustomerReceipt, previewReceipt } from '@/lib/receipt';
import { useToast } from '@/hooks/use-toast';

export default function PrinterSettingsCard() {
  const [settings, setSettings] = useState<PrinterSettings>({
    enabled: true,
    width: 40,
    autoPrint: false
  });
  const { toast } = useToast();

  useEffect(() => {
    setSettings(getPrinterSettings());
  }, []);

  const handleSave = () => {
    savePrinterSettings(settings);
    toast({
      title: 'Settings Saved',
      description: 'Printer settings have been updated successfully.',
    });
  };

  const handleTestPrint = () => {
    const testReceipt = {
      receiptNumber: 'MSC-20241101-TEST',
      orderNumber: 'ORD-TEST-001',
      customerName: 'Test Customer',
      saleDate: new Date(),
      subtotal: 150.00,
      total: 150.00,
      paymentMethod: 'cash',
      amountTendered: 200.00,
      changeGiven: 50.00,
      items: [
        { name: 'Classic Cheeseburger', quantity: 2, price: 50.00, total: 100.00 },
        { name: 'Fries', quantity: 1, price: 50.00, total: 50.00 },
      ]
    };

    const receipt = generateCustomerReceipt(testReceipt);
    previewReceipt(receipt, 'customer');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Printer className="h-5 w-5" />
          <CardTitle>Receipt Printer Settings</CardTitle>
        </div>
        <CardDescription>
          Configure thermal printer settings for receipt printing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="printer-enabled">Enable Printing</Label>
              <p className="text-sm text-muted-foreground">
                Turn on/off automatic receipt printing
              </p>
            </div>
            <Switch
              id="printer-enabled"
              checked={settings.enabled}
              onCheckedChange={(checked) => setSettings({ ...settings, enabled: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-print">Auto-Print</Label>
              <p className="text-sm text-muted-foreground">
                Automatically print without preview dialog
              </p>
            </div>
            <Switch
              id="auto-print"
              checked={settings.autoPrint}
              onCheckedChange={(checked) => setSettings({ ...settings, autoPrint: checked })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="printer-width">Printer Width</Label>
            <Select
              value={settings.width.toString()}
              onValueChange={(value) => setSettings({ ...settings, width: parseInt(value) })}
            >
              <SelectTrigger id="printer-width">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="32">32mm (Very Small)</SelectItem>
                <SelectItem value="40">40mm (Small - Default)</SelectItem>
                <SelectItem value="48">48mm (Medium)</SelectItem>
                <SelectItem value="58">58mm (Large)</SelectItem>
                <SelectItem value="80">80mm (Extra Large)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Set the width to match your thermal printer
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button onClick={handleSave} className="flex-1">
            <Check className="mr-2 h-4 w-4" />
            Save Settings
          </Button>
          <Button onClick={handleTestPrint} variant="outline">
            <Printer className="mr-2 h-4 w-4" />
            Test Print
          </Button>
        </div>

        <div className="p-4 bg-muted rounded-lg space-y-2">
          <h4 className="font-semibold text-sm">Current Configuration:</h4>
          <ul className="text-sm space-y-1">
            <li>• Printing: {settings.enabled ? 'Enabled' : 'Disabled'}</li>
            <li>• Auto-Print: {settings.autoPrint ? 'Yes' : 'No (Preview first)'}</li>
            <li>• Width: {settings.width} characters ({settings.width === 58 ? '58mm' : settings.width === 80 ? '80mm' : 'Custom'})</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}