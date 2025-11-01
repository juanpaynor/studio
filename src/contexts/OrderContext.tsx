'use client';

import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import type { OrderItem, Product } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, generateOrderNumber } from '@/lib/utils';

interface OrderContextType {
  orderItems: OrderItem[];
  customerName: string;
  orderNumber: string;
  isSubmitting: boolean;
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  setCustomerName: (name: string) => void;
  clearOrder: () => void;
  setSubmitting: (submitting: boolean) => void;
  subtotal: number;
  total: number;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider = ({ children }: { children: React.ReactNode }) => {
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [customerName, setCustomerName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [orderCount] = useState(4); // In real app, this would come from database
  const { toast } = useToast();

  const orderNumber = useMemo(() => generateOrderNumber(orderCount), [orderCount]);

  const addItem = useCallback((product: Product) => {
    if (!product.isAvailable) {
      toast({
        title: "Item not available",
        description: `${product.name} is currently unavailable.`,
        variant: "destructive",
      });
      return;
    }

    setOrderItems((prevItems) => {
      const existingItem = prevItems.find(
        (item) => item.product.id === product.id
      );
      if (existingItem) {
        return prevItems.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevItems, { product, quantity: 1 }];
    });
    toast({
        title: `${product.name} added to order!`,
        description: "You can adjust the quantity in the order summary.",
    });
  }, [toast]);

  const removeItem = useCallback((productId: string) => {
    setOrderItems((prevItems) =>
      prevItems.filter((item) => item.product.id !== productId)
    );
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setOrderItems((prevItems) =>
      prevItems.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  }, [removeItem]);

  const clearOrder = useCallback(() => {
    setOrderItems([]);
    setCustomerName('');
    setIsSubmitting(false);
  }, []);

  const setSubmitting = useCallback((submitting: boolean) => {
    setIsSubmitting(submitting);
  }, []);

  const { subtotal, total } = useMemo(() => {
    const subtotal = orderItems.reduce(
      (acc, item) => acc + item.product.price * item.quantity,
      0
    );
    const total = subtotal; // No tax calculation
    return { 
      subtotal: Number(subtotal.toFixed(2)), 
      total: Number(total.toFixed(2)) 
    };
  }, [orderItems]);

  const value = useMemo(() => ({
    orderItems,
    customerName,
    orderNumber,
    isSubmitting,
    addItem,
    removeItem,
    updateQuantity,
    setCustomerName,
    clearOrder,
    setSubmitting,
    subtotal,
    total,
  }), [
    orderItems,
    customerName,
    orderNumber,
    isSubmitting,
    addItem,
    removeItem,
    updateQuantity,
    clearOrder,
    setSubmitting,
    subtotal,
    total,
  ]);

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
};
