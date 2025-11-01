import type { Product, Order, Transaction } from './types';
import { PlaceHolderImages } from './placeholder-images';

const products: Product[] = [
  { id: '1', name: 'The Classic', price: 8.99, category: 'Sandwiches', imageUrl: PlaceHolderImages[0].imageUrl, imageHint: PlaceHolderImages[0].imageHint },
  { id: '2', name: 'Bacon Bliss', price: 10.99, category: 'Sandwiches', imageUrl: PlaceHolderImages[1].imageUrl, imageHint: PlaceHolderImages[1].imageHint },
  { id: '3', name: 'Jalapeño Popper', price: 9.99, category: 'Sandwiches', imageUrl: PlaceHolderImages[2].imageUrl, imageHint: PlaceHolderImages[2].imageHint },
  { id: '10', name: 'Veggie Delight', price: 9.49, category: 'Sandwiches', imageUrl: PlaceHolderImages[9].imageUrl, imageHint: PlaceHolderImages[9].imageHint },
  { id: '4', name: 'Tomato Soup', price: 4.50, category: 'Sides', imageUrl: PlaceHolderImages[3].imageUrl, imageHint: PlaceHolderImages[3].imageHint },
  { id: '5', name: 'French Fries', price: 3.50, category: 'Sides', imageUrl: PlaceHolderImages[4].imageUrl, imageHint: PlaceHolderImages[4].imageHint },
  { id: '6', name: 'Onion Rings', price: 4.00, category: 'Sides', imageUrl: PlaceHolderImages[5].imageUrl, imageHint: PlaceHolderImages[5].imageHint },
  { id: '11', name: 'Mozzarella Sticks', price: 5.50, category: 'Sides', imageUrl: PlaceHolderImages[10].imageUrl, imageHint: PlaceHolderImages[10].imageHint },
  { id: '7', name: 'Cola', price: 2.50, category: 'Drinks', imageUrl: PlaceHolderImages[6].imageUrl, imageHint: PlaceHolderImages[6].imageHint },
  { id: '8', name: 'Lemonade', price: 3.00, category: 'Drinks', imageUrl: PlaceHolderImages[7].imageUrl, imageHint: PlaceHolderImages[7].imageHint },
  { id: '9', name: 'Water', price: 2.00, category: 'Drinks', imageUrl: PlaceHolderImages[8].imageUrl, imageHint: PlaceHolderImages[8].imageHint },
  { id: '12', name: 'Iced Tea', price: 2.75, category: 'Drinks', imageUrl: PlaceHolderImages[11].imageUrl, imageHint: PlaceHolderImages[11].imageHint },
];

const pastOrders: Order[] = [
    {
        id: 'po1',
        items: [
            { product: products[0], quantity: 1 },
            { product: products[4], quantity: 1 },
            { product: products[7], quantity: 1 },
        ],
        total: 15.99,
        createdAt: new Date('2023-10-26T12:30:00Z'),
    },
    {
        id: 'po2',
        items: [
            { product: products[1], quantity: 2 },
            { product: products[5], quantity: 1 },
        ],
        total: 25.48,
        createdAt: new Date('2023-10-26T13:00:00Z'),
    },
    {
        id: 'po3',
        items: [
            { product: products[2], quantity: 1 },
            { product: products[8], quantity: 1 },
        ],
        total: 12.49,
        createdAt: new Date('2023-10-27T14:00:00Z'),
    },
     {
        id: 'po4',
        items: [
            { product: products[0], quantity: 1 },
            { product: products[3], quantity: 1 },
        ],
        total: 13.99,
        createdAt: new Date('2023-10-28T18:00:00Z'),
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
