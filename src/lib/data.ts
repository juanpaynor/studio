import type { Product, Order, Transaction } from './types';
import { PlaceHolderImages } from './placeholder-images';

const products: Product[] = [
  { id: '1', name: 'The Classic', price: 189.99, category: 'Sandwiches', imageUrl: PlaceHolderImages[0].imageUrl, imageHint: PlaceHolderImages[0].imageHint, isAvailable: true },
  { id: '2', name: 'Bacon Bliss', price: 229.99, category: 'Sandwiches', imageUrl: PlaceHolderImages[1].imageUrl, imageHint: PlaceHolderImages[1].imageHint, isAvailable: true },
  { id: '3', name: 'Jalapeño Popper', price: 209.99, category: 'Sandwiches', imageUrl: PlaceHolderImages[2].imageUrl, imageHint: PlaceHolderImages[2].imageHint, isAvailable: true },
  { id: '10', name: 'Veggie Delight', price: 199.49, category: 'Sandwiches', imageUrl: PlaceHolderImages[9].imageUrl, imageHint: PlaceHolderImages[9].imageHint, isAvailable: true },
  { id: '4', name: 'Tomato Soup', price: 95.50, category: 'Sides', imageUrl: PlaceHolderImages[3].imageUrl, imageHint: PlaceHolderImages[3].imageHint, isAvailable: true },
  { id: '5', name: 'French Fries', price: 75.50, category: 'Sides', imageUrl: PlaceHolderImages[4].imageUrl, imageHint: PlaceHolderImages[4].imageHint, isAvailable: true },
  { id: '6', name: 'Onion Rings', price: 85.00, category: 'Sides', imageUrl: PlaceHolderImages[5].imageUrl, imageHint: PlaceHolderImages[5].imageHint, isAvailable: true },
  { id: '11', name: 'Mozzarella Sticks', price: 115.50, category: 'Sides', imageUrl: PlaceHolderImages[10].imageUrl, imageHint: PlaceHolderImages[10].imageHint, isAvailable: true },
  { id: '7', name: 'Cola', price: 55.50, category: 'Drinks', imageUrl: PlaceHolderImages[6].imageUrl, imageHint: PlaceHolderImages[6].imageHint, isAvailable: true },
  { id: '8', name: 'Lemonade', price: 65.00, category: 'Drinks', imageUrl: PlaceHolderImages[7].imageUrl, imageHint: PlaceHolderImages[7].imageHint, isAvailable: true },
  { id: '9', name: 'Water', price: 35.00, category: 'Drinks', imageUrl: PlaceHolderImages[8].imageUrl, imageHint: PlaceHolderImages[8].imageHint, isAvailable: true },
  { id: '12', name: 'Iced Tea', price: 59.75, category: 'Drinks', imageUrl: PlaceHolderImages[11].imageUrl, imageHint: PlaceHolderImages[11].imageHint, isAvailable: true },
];

const pastOrders: Order[] = [
    {
        id: 'po1',
        orderNumber: '#001',
        customerName: 'Juan dela Cruz',
        items: [
            { product: products[0], quantity: 1 },
            { product: products[4], quantity: 1 },
            { product: products[7], quantity: 1 },
        ],
        subtotal: 340.99,
        total: 367.47, // with 8% tax
        status: 'completed',
        createdAt: new Date('2023-10-26T12:30:00Z'),
        updatedAt: new Date('2023-10-26T12:45:00Z'),
    },
    {
        id: 'po2',
        orderNumber: '#002',
        customerName: 'Maria Santos',
        items: [
            { product: products[1], quantity: 2 },
            { product: products[5], quantity: 1 },
        ],
        subtotal: 535.48,
        total: 578.32, // with 8% tax
        status: 'completed',
        createdAt: new Date('2023-10-26T13:00:00Z'),
        updatedAt: new Date('2023-10-26T13:15:00Z'),
    },
    {
        id: 'po3',
        orderNumber: '#003',
        customerName: 'Pedro Reyes',
        items: [
            { product: products[2], quantity: 1 },
            { product: products[8], quantity: 1 },
        ],
        subtotal: 274.99,
        total: 296.99, // with 8% tax
        status: 'ready',
        createdAt: new Date('2023-10-27T14:00:00Z'),
        updatedAt: new Date('2023-10-27T14:10:00Z'),
    },
     {
        id: 'po4',
        orderNumber: '#004',
        customerName: 'Ana Garcia',
        items: [
            { product: products[0], quantity: 1 },
            { product: products[3], quantity: 1 },
        ],
        subtotal: 285.49,
        total: 308.33, // with 8% tax
        status: 'preparing',
        createdAt: new Date('2023-10-28T18:00:00Z'),
        updatedAt: new Date('2023-10-28T18:05:00Z'),
    },
];

const transactions: Transaction[] = [
    { id: 'tr1', order: pastOrders[0], paymentMethod: 'cash', amountTendered: 20.00, changeGiven: 4.01, timestamp: new Date() },
    { id: 'tr2', order: pastOrders[1], paymentMethod: 'digital', timestamp: new Date(Date.now() - 86400000 * 2) },
    { id: 'tr3', order: pastOrders[2], paymentMethod: 'digital', timestamp: new Date(Date.now() - 86400000 * 5) },
    { id: 'tr4', order: pastOrders[3], paymentMethod: 'cash', amountTendered: 15, changeGiven: 1.01, timestamp: new Date(Date.now() - 86400000 * 10) },
];


export const getProducts = () => products;
export const getCategories = () => ['Sandwiches', 'Sides', 'Drinks'];
export const getPastOrders = () => pastOrders;
export const getTransactions = () => transactions;
