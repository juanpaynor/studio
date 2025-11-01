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

export type SalesData = {
  date: string;
  sales: number;
};
