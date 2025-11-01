import { formatCurrency } from '@/lib/utils';

export interface ReceiptData {
  receiptNumber: string;
  orderNumber: string;
  customerName: string;
  saleDate: Date | string;
  subtotal: number;
  total: number;
  paymentMethod: string;
  amountTendered?: number;
  changeGiven?: number;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
}

export interface PrinterSettings {
  enabled: boolean;
  width: number; // Characters wide
  autoPrint: boolean;
  printerName?: string;
}

// Get printer settings from localStorage
export function getPrinterSettings(): PrinterSettings {
  if (typeof window === 'undefined') {
    return { enabled: true, width: 40, autoPrint: false };
  }
  
  const saved = localStorage.getItem('printerSettings');
  if (saved) {
    return JSON.parse(saved);
  }
  
  return { enabled: true, width: 40, autoPrint: false };
}

// Save printer settings
export function savePrinterSettings(settings: PrinterSettings): void {
  localStorage.setItem('printerSettings', JSON.stringify(settings));
}

export function generateCustomerReceipt(data: ReceiptData): string {
  const settings = getPrinterSettings();
  const receiptWidth = settings.width;
  const line = '='.repeat(receiptWidth);
  const halfLine = '-'.repeat(receiptWidth);
  
  // Normalize field names (handle both camelCase and snake_case from database)
  const receiptNumber = (data as any).receipt_number || data.receiptNumber || 'N/A';
  const orderNumber = (data as any).order_number || data.orderNumber || 'N/A';
  const customerName = (data as any).customer_name || data.customerName || 'Guest';
  const dateValue = (data as any).sale_date || data.saleDate;
  const saleDate = dateValue ? (typeof dateValue === 'string' ? new Date(dateValue) : dateValue) : new Date();
  const paymentMethod = (data as any).payment_method || data.paymentMethod || 'digital';
  const amountTendered = (data as any).amount_tendered || data.amountTendered;
  const changeGiven = (data as any).change_given || data.changeGiven;
  
  let receipt = '';
  
  // Header
  receipt += centerText('Ms. Cheesy', receiptWidth) + '\n';
  receipt += centerText('123 Cheese Street, Manila', receiptWidth) + '\n';
  receipt += centerText('+63 123 456 7890', receiptWidth) + '\n';
  receipt += line + '\n';
  receipt += centerText('CUSTOMER COPY', receiptWidth) + '\n';
  receipt += line + '\n\n';
  
  // Order details
  receipt += `Receipt #: ${receiptNumber}\n`;
  receipt += `Order #: ${orderNumber}\n`;
  receipt += `Customer: ${customerName}\n`;
  receipt += `Date: ${saleDate.toLocaleDateString()}\n`;
  receipt += `Time: ${saleDate.toLocaleTimeString()}\n`;
  receipt += halfLine + '\n';
  
  // Items
  receipt += leftPadText('Item', 'Price', receiptWidth) + '\n';
  receipt += halfLine + '\n';
  
  data.items.forEach(item => {
    const itemName = `${item.quantity}x ${item.name}`;
    const itemPrice = formatCurrency(item.total);
    receipt += leftPadText(itemName, itemPrice, receiptWidth) + '\n';
  });
  
  receipt += halfLine + '\n';
  
  // Totals
  receipt += leftPadText('Subtotal:', formatCurrency(data.subtotal), receiptWidth) + '\n';
  receipt += leftPadText('TOTAL:', formatCurrency(data.total), receiptWidth) + '\n';
  
  // Payment details (using normalized variables from above)
  if (paymentMethod === 'cash' && amountTendered) {
    receipt += halfLine + '\n';
    receipt += leftPadText('Cash Tendered:', formatCurrency(amountTendered), receiptWidth) + '\n';
    if (changeGiven && changeGiven > 0) {
      receipt += leftPadText('Change:', formatCurrency(changeGiven), receiptWidth) + '\n';
    }
  } else {
    receipt += leftPadText('Payment:', paymentMethod.toUpperCase(), receiptWidth) + '\n';
  }
  
  receipt += line + '\n';
  receipt += centerText('Thank you for your order!', receiptWidth) + '\n';
  receipt += centerText('Please come again!', receiptWidth) + '\n';
  receipt += line + '\n\n';
  
  return receipt;
}

export function generateKitchenReceipt(data: ReceiptData): string {
  const settings = getPrinterSettings();
  const receiptWidth = settings.width;
  const line = '='.repeat(receiptWidth);
  const halfLine = '-'.repeat(receiptWidth);
  
  // Normalize field names (handle both camelCase and snake_case from database)
  const orderNumber = (data as any).order_number || data.orderNumber || 'N/A';
  const customerName = (data as any).customer_name || data.customerName || 'Guest';
  const dateValue = (data as any).sale_date || data.saleDate;
  const saleDate = dateValue ? (typeof dateValue === 'string' ? new Date(dateValue) : dateValue) : new Date();
  
  let receipt = '';
  
  // Header
  receipt += centerText('KITCHEN COPY', receiptWidth) + '\n';
  receipt += line + '\n\n';
  
  // Order details
  receipt += `Order #: ${orderNumber}\n`;
  receipt += `Customer: ${customerName}\n`;
  receipt += `Time: ${saleDate.toLocaleTimeString()}\n`;
  receipt += halfLine + '\n';
  
  // Items (no prices)
  receipt += 'ITEMS TO PREPARE:\n';
  receipt += halfLine + '\n';
  
  data.items.forEach(item => {
    receipt += `${item.quantity}x ${item.name}\n`;
  });
  
  receipt += halfLine + '\n';
  receipt += `Total Items: ${data.items.reduce((sum, item) => sum + item.quantity, 0)}\n`;
  receipt += line + '\n\n';
  
  return receipt;
}

// Helper functions
function centerText(text: string, width: number): string {
  if (!text || text.length >= width) return text || '';
  const padding = Math.floor((width - text.length) / 2);
  return ' '.repeat(padding) + text;
}

function leftPadText(left: string, right: string, width: number): string {
  if (!left || !right) return '';
  const maxLeftWidth = width - right.length - 1;
  const truncatedLeft = left.length > maxLeftWidth ? 
    left.substring(0, maxLeftWidth - 3) + '...' : left;
  const padding = width - truncatedLeft.length - right.length;
  return truncatedLeft + ' '.repeat(Math.max(1, padding)) + right;
}

// Print receipt
export function printReceipt(receiptText: string, type: 'customer' | 'kitchen' = 'customer'): void {
  const settings = getPrinterSettings();
  
  if (!settings.enabled) {
    console.log('Printing disabled in settings');
    return;
  }
  
  const printWindow = window.open('', '_blank', 'width=400,height=600');
  
  if (!printWindow) {
    console.error('Could not open print window');
    return;
  }
  
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${type === 'customer' ? 'Customer' : 'Kitchen'} Receipt</title>
      <style>
        body {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          margin: 0;
          padding: 20px;
          white-space: pre-wrap;
          line-height: 1.2;
        }
        @media print {
          body { margin: 0; padding: 10px; }
          @page { 
            size: ${settings.width === 58 ? '58mm' : '80mm'} auto; 
            margin: 0; 
          }
        }
      </style>
    </head>
    <body>${receiptText}</body>
    </html>
  `);
  
  printWindow.document.close();
  
  // Auto-print if enabled
  if (settings.autoPrint) {
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  }
}

// Preview receipt without printing
export function previewReceipt(receiptText: string, type: 'customer' | 'kitchen' = 'customer'): void {
  const previewWindow = window.open('', '_blank', 'width=500,height=700');
  
  if (!previewWindow) {
    console.error('Could not open preview window');
    return;
  }
  
  previewWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${type === 'customer' ? 'Customer' : 'Kitchen'} Receipt Preview</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          background: #f5f5f5;
        }
        .controls {
          background: white;
          padding: 15px;
          margin-bottom: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .controls button {
          background: #4CAF50;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          margin-right: 10px;
          font-size: 14px;
        }
        .controls button:hover {
          background: #45a049;
        }
        .receipt {
          background: white;
          padding: 20px;
          font-family: 'Courier New', monospace;
          font-size: 12px;
          white-space: pre-wrap;
          line-height: 1.2;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          max-width: 400px;
          margin: 0 auto;
        }
      </style>
    </head>
    <body>
      <div class="controls">
        <button onclick="window.print()">🖨️ Print</button>
        <button onclick="downloadReceipt()">💾 Download</button>
        <button onclick="window.close()">❌ Close</button>
      </div>
      <div class="receipt">${receiptText}</div>
      <script>
        function downloadReceipt() {
          const text = document.querySelector('.receipt').textContent;
          const blob = new Blob([text], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = 'receipt-${Date.now()}.txt';
          link.click();
          URL.revokeObjectURL(url);
        }
      </script>
    </body>
    </html>
  `);
  
  previewWindow.document.close();
}