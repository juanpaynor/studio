'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CreditCard, DollarSign, CheckCircle } from 'lucide-react';
import { useOrder } from '@/contexts/OrderContext';
import { useToast } from '@/hooks/use-toast';

export default function CheckoutDialog() {
  const { total, orderItems, clearOrder } = useOrder();
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'digital'>('digital');
  const [amountTendered, setAmountTendered] = useState('');
  const [change, setChange] = useState(0);
  const [isPaid, setIsPaid] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (paymentMethod === 'cash' && amountTendered) {
      const tendered = parseFloat(amountTendered);
      if (!isNaN(tendered) && tendered >= total) {
        setChange(tendered - total);
      } else {
        setChange(0);
      }
    }
  }, [amountTendered, total, paymentMethod]);

  const handlePayment = () => {
    // In a real app, this would process payment and save the transaction.
    setIsPaid(true);
    setTimeout(() => {
        clearOrder();
        toast({
            title: "Transaction Complete!",
            description: "The order has been successfully processed.",
            className: 'bg-green-500 text-white',
        });
        setOpen(false);
        // Reset state for next transaction
        setTimeout(() => {
            setIsPaid(false);
            setAmountTendered('');
            setChange(0);
            setPaymentMethod('digital');
        }, 500);
    }, 2000);
  };
  
  const isCashPaymentValid = paymentMethod === 'cash' && parseFloat(amountTendered) >= total;
  const canPay = (paymentMethod === 'digital' && total > 0) || isCashPaymentValid;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className="mt-4 w-full bg-accent text-accent-foreground hover:bg-accent/90"
          size="lg"
          disabled={orderItems.length === 0}
        >
          Checkout
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        {isPaid ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <CheckCircle className="h-24 w-24 animate-pulse text-green-500" />
            <DialogTitle className="mt-4 text-2xl">Payment Confirmed!</DialogTitle>
            <DialogDescription>
                {paymentMethod === 'cash' && `Change due: $${change.toFixed(2)}`}
            </DialogDescription>
             <p className="mt-4 text-sm text-muted-foreground">Thank you for your order.</p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl">Checkout</DialogTitle>
              <DialogDescription>
                Total amount to be paid:
                <span className="font-bold text-foreground"> ${total.toFixed(2)}</span>
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <RadioGroup
                defaultValue="digital"
                onValueChange={(value: 'cash' | 'digital') => setPaymentMethod(value)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="digital" id="r2" />
                  <Label htmlFor="r2" className="flex items-center gap-2 text-base">
                    <CreditCard /> Digital Payment
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cash" id="r1" />
                  <Label htmlFor="r1" className="flex items-center gap-2 text-base">
                    <DollarSign /> Cash
                  </Label>
                </div>
              </RadioGroup>

              {paymentMethod === 'cash' && (
                <div className="mt-4 grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="amount-tendered">Amount Tendered</Label>
                  <Input
                    type="number"
                    id="amount-tendered"
                    placeholder="e.g., 20.00"
                    value={amountTendered}
                    onChange={(e) => setAmountTendered(e.target.value)}
                  />
                  {isCashPaymentValid && (
                    <p className="mt-2 text-sm font-medium text-green-600">
                      Change due: ${change.toFixed(2)}
                    </p>
                  )}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={handlePayment} disabled={!canPay} className="w-full">
                Confirm Payment
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
