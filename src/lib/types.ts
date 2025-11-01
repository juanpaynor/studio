export type Product = {
  id: string;
  name: string;
  price: number;
  category: 'Sandwiches' | 'Sides' | 'Drinks' | 'Snacks';
  imageUrl: string;
  imageHint: string;
  isAvailable: boolean;
};

export type OrderItem = {
  product: Product;
  quantity: number;
};

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'completed';

export type Order = {
  id: string;
  orderNumber: string;
  customerName: string;
  items: OrderItem[];
  subtotal: number;
  total: number;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type Transaction = {
  id: string;
  order: Order;
  paymentMethod: 'cash' | 'digital';
  amountTendered?: number;
  changeGiven?: number;
  timestamp: Date;
};

export type Sale = {
  id: string;
  receiptNumber: string;
  orderId: string;
  customerName: string;
  saleDate: Date;
  subtotal: number;
  taxAmount: number;
  total: number;
  paymentMethod: 'cash' | 'digital';
  amountTendered?: number;
  changeGiven?: number;
  cashierId?: string;
  receiptPrinted: boolean;
  receiptData?: any;
  notes?: string;
  items: SaleItem[];
};

export type SaleItem = {
  id: string;
  saleId: string;
  productId: string;
  productName: string;
  productCategory: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type SalesData = {
  date: string;
  sales: number;
};

export type SalesReport = {
  saleId: string;
  receiptNumber: string;
  customerName: string;
  saleDate: Date;
  subtotal: number;
  total: number;
  paymentMethod: 'cash' | 'digital';
  cashierName: string;
  itemsCount: number;
};

export type ReceiptData = {
  receiptNumber: string;
  orderNumber: string;
  customerName: string;
  saleDate: Date;
  subtotal: number;
  total: number;
  paymentMethod: 'cash' | 'digital';
  amountTendered?: number;
  changeGiven?: number;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
};
