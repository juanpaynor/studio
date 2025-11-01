'use client';

import { useOrder } from '@/contexts/OrderContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Minus, Plus, Trash2, ShoppingCart } from 'lucide-react';
import Image from 'next/image';
import CheckoutDialog from './CheckoutDialog';

export default function OrderSummary() {
  const {
    orderItems,
    updateQuantity,
    removeItem,
    subtotal,
    tax,
    total,
  } = useOrder();

  return (
    <div className="flex flex-1 flex-col p-4">
      <h2 className="font-headline text-2xl font-bold">Order Summary</h2>
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
            {orderItems.map(({ product, quantity }) => (
              <div key={product.id} className="flex items-center gap-4">
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  width={64}
                  height={64}
                  className="rounded-md object-cover"
                  data-ai-hint={product.imageHint}
                />
                <div className="flex-1">
                  <p className="font-semibold">{product.name}</p>
                  <p className="text-sm text-muted-foreground">
                    ${product.price.toFixed(2)}
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
            ))}
          </div>
        </ScrollArea>
      )}
      <div className="mt-auto border-t pt-4">
        <div className="space-y-2 text-lg">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Tax (8%)</span>
            <span>${tax.toFixed(2)}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
        <CheckoutDialog />
      </div>
    </div>
  );
}
