import type { Order } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

export interface ReceiptData {
  order: Order;
  timestamp: Date;
  cashierName?: string;
  storeName: string;
  storeAddress: string;
  storePhone: string;
}

export function generateCustomerReceipt(data: ReceiptData): string {
  const { order, timestamp, storeName, storeAddress, storePhone } = data;
  
  const receiptWidth = 40; // Characters wide for thermal printer
  const line = '='.repeat(receiptWidth);
  const halfLine = '-'.repeat(receiptWidth);
  
  let receipt = '';
  
  // Header
  receipt += centerText(storeName, receiptWidth) + '\n';
  receipt += centerText(storeAddress, receiptWidth) + '\n';
  receipt += centerText(storePhone, receiptWidth) + '\n';
  receipt += line + '\n';
  receipt += centerText('CUSTOMER COPY', receiptWidth) + '\n';
  receipt += line + '\n\n';
  
  // Order details
  receipt += `Order #: ${order.orderNumber}\n`;
  receipt += `Customer: ${order.customerName}\n`;
  receipt += `Date: ${timestamp.toLocaleDateString()}\n`;
  receipt += `Time: ${timestamp.toLocaleTimeString()}\n`;
  receipt += halfLine + '\n';
  
  // Items
  receipt += leftPadText('Item', 'Price', receiptWidth) + '\n';
  receipt += halfLine + '\n';
  
  order.items.forEach(item => {
    const itemName = `${item.quantity}x ${item.product.name}`;
    const itemPrice = formatCurrency(item.product.price * item.quantity);
    receipt += leftPadText(itemName, itemPrice, receiptWidth) + '\n';
  });
  
  receipt += halfLine + '\n';
  
  // Totals
  receipt += leftPadText('Subtotal:', formatCurrency(order.subtotal), receiptWidth) + '\n';
  receipt += leftPadText('Tax (8%):', formatCurrency(order.total - order.subtotal), receiptWidth) + '\n';
  receipt += leftPadText('TOTAL:', formatCurrency(order.total), receiptWidth) + '\n';
  
  receipt += line + '\n';
  receipt += centerText('Thank you for your order!', receiptWidth) + '\n';
  receipt += centerText('Please come again!', receiptWidth) + '\n';
  receipt += line + '\n\n';
  
  return receipt;
}

export function generateKitchenReceipt(data: ReceiptData): string {
  const { order, timestamp } = data;
  
  const receiptWidth = 40;
  const line = '='.repeat(receiptWidth);
  const halfLine = '-'.repeat(receiptWidth);
  
  let receipt = '';
  
  // Header
  receipt += centerText('KITCHEN COPY', receiptWidth) + '\n';
  receipt += line + '\n\n';
  
  // Order details
  receipt += `Order #: ${order.orderNumber}\n`;
  receipt += `Customer: ${order.customerName}\n`;
  receipt += `Time: ${timestamp.toLocaleTimeString()}\n`;
  receipt += halfLine + '\n';
  
  // Items (no prices)
  receipt += 'ITEMS TO PREPARE:\n';
  receipt += halfLine + '\n';
  
  order.items.forEach(item => {
    receipt += `${item.quantity}x ${item.product.name}\n`;
    if (item.product.category) {
      receipt += `    (${item.product.category})\n`;
    }
  });
  
  receipt += halfLine + '\n';
  receipt += `Total Items: ${order.items.reduce((sum, item) => sum + item.quantity, 0)}\n`;
  receipt += line + '\n\n';
  
  return receipt;
}

// Helper functions
function centerText(text: string, width: number): string {
  if (text.length >= width) return text;
  const padding = Math.floor((width - text.length) / 2);
  return ' '.repeat(padding) + text;
}

function leftPadText(left: string, right: string, width: number): string {
  const maxLeftWidth = width - right.length - 1;
  const truncatedLeft = left.length > maxLeftWidth ? 
    left.substring(0, maxLeftWidth - 3) + '...' : left;
  const padding = width - truncatedLeft.length - right.length;
  return truncatedLeft + ' '.repeat(Math.max(1, padding)) + right;
}

// Print functions
export function printReceipt(receiptText: string, type: 'customer' | 'kitchen' = 'customer'): void {
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
          @page { size: 80mm auto; margin: 0; }
        }
      </style>
    </head>
    <body>${receiptText}</body>
    </html>
  `);
  
  printWindow.document.close();
  
  // Auto-print after a short delay
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 500);
}

export function downloadReceiptAsPDF(receiptText: string, filename: string): void {
  // Create a blob with the receipt text
  const blob = new Blob([receiptText], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  
  // Create download link
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up
  URL.revokeObjectURL(url);
}