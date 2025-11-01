'use client';

import * as React from 'react';
import { useOrder } from '@/contexts/OrderContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Minus, Plus, Trash2, ShoppingCart, User } from 'lucide-react';
import Image from 'next/image';
import CheckoutDialog from './CheckoutDialog';
import { formatCurrency } from '@/lib/utils';

// Memoized order item component for better performance
const OrderItem = React.memo(({ product, quantity, updateQuantity, removeItem }: {
  product: any;
  quantity: number;
  updateQuantity: (id: string, qty: number) => void;
  removeItem: (id: string) => void;
}) => {
  const imageUrl = React.useMemo(() => {
    return product.imageUrl || `/api/placeholder/64/64?text=${encodeURIComponent(product.name.charAt(0))}`;
  }, [product.imageUrl, product.name]);

  return (
    <div className="flex items-center gap-4">
      <div className="relative w-16 h-16 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
        <Image
          src={imageUrl}
          alt={product.name}
          fill
          className="object-cover"
          data-ai-hint={product.imageHint}
          sizes="64px"
          loading="lazy"
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate">{product.name}</p>
        <p className="text-sm text-muted-foreground">
          {formatCurrency(product.price)}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => updateQuantity(product.id, quantity - 1)}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <span className="w-6 text-center font-bold">{quantity}</span>
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => updateQuantity(product.id, quantity + 1)}
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive"
          onClick={() => removeItem(product.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
});

OrderItem.displayName = 'OrderItem';

export default function OrderSummary() {
  const {
    orderItems,
    customerName,
    orderNumber,
    updateQuantity,
    removeItem,
    setCustomerName,
    subtotal,
    tax,
    total,
  } = useOrder();

  // Memoize order items rendering
  const orderItemsElements = React.useMemo(() => {
    return orderItems.map(({ product, quantity }) => (
      <OrderItem
        key={product.id}
        product={product}
        quantity={quantity}
        updateQuantity={updateQuantity}
        removeItem={removeItem}
      />
    ));
  }, [orderItems, updateQuantity, removeItem]);

  return (
    <div className="flex flex-1 flex-col p-4">
      <h2 className="font-headline text-2xl font-bold">Order Summary</h2>
      <p className="text-sm text-muted-foreground mb-4">Order {orderNumber}</p>
      
      {/* Customer Name Input */}
      <div className="mb-4">
        <Label htmlFor="customer-name" className="flex items-center gap-2 text-sm font-medium">
          <User className="h-4 w-4" />
          Customer Name
        </Label>
        <Input
          id="customer-name"
          placeholder="Enter customer name"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          className="mt-1"
        />
      </div>
      
      <Separator className="my-4" />
      {orderItems.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-muted-foreground">
          <ShoppingCart className="mb-4 h-16 w-16" />
          <p className="text-lg">Your order is empty.</p>
          <p className="text-sm">Click on items to add them.</p>
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <div className="space-y-4 pr-4">
            {orderItemsElements}
          </div>
        </ScrollArea>
      )}
      <div className="mt-auto border-t pt-4">
        <div className="space-y-2 text-lg">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Tax (8%)</span>
            <span>{formatCurrency(tax)}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>
        <CheckoutDialog />
      </div>
    </div>
  );
}
