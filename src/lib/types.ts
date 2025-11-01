export type Product = {
  id: string;
  name: string;
  price: number;
  category: 'Sandwiches' | 'Sides' | 'Drinks';
  imageUrl: string;
  imageHint: string;
};

export type OrderItem = {
  product: Product;
  quantity: number;
};

export type Order = {
  id: string;
  items: OrderItem[];
  total: number;
  createdAt: Date;
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
