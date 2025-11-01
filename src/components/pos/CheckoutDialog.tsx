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
import { CreditCard, DollarSign, CheckCircle, Printer } from 'lucide-react';
import { useOrder } from '@/contexts/OrderContext';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
import { generateCustomerReceipt, generateKitchenReceipt, printReceipt, type ReceiptData } from '@/lib/receipt';

export default function CheckoutDialog() {
  const { total, orderItems, customerName, orderNumber, subtotal, clearOrder } = useOrder();
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
    if (!customerName.trim()) {
      toast({
        title: "Customer name required",
        description: "Please enter a customer name before checkout.",
        variant: "destructive",
      });
      return;
    }

    // Create order object for receipt
    const orderForReceipt = {
      id: crypto.randomUUID(),
      orderNumber,
      customerName,
      items: orderItems,
      subtotal,
      total,
      status: 'pending' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const receiptData: ReceiptData = {
      order: orderForReceipt,
      timestamp: new Date(),
      storeName: 'Ms. Cheesy',
      storeAddress: '123 Cheese Street, Manila, Philippines',
      storePhone: '+63 123 456 7890',
    };

    // Generate and print receipts
    try {
      const customerReceipt = generateCustomerReceipt(receiptData);
      const kitchenReceipt = generateKitchenReceipt(receiptData);
      
      // Print customer receipt
      printReceipt(customerReceipt, 'customer');
      
      // Print kitchen receipt after a short delay
      setTimeout(() => {
        printReceipt(kitchenReceipt, 'kitchen');
      }, 1000);
      
      toast({
        title: "Receipts Generated!",
        description: "Customer and kitchen receipts have been sent to printer.",
      });
    } catch (error) {
      console.error('Error generating receipts:', error);
      toast({
        title: "Receipt Error",
        description: "Could not generate receipts, but payment was processed.",
        variant: "destructive",
      });
    }

    // In a real app, this would process payment and save the transaction.
    setIsPaid(true);
    setTimeout(() => {
        clearOrder();
        toast({
            title: "Transaction Complete!",
            description: `Order ${orderNumber} for ${customerName} has been processed.`,
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
  const canPay = (paymentMethod === 'digital' && total > 0 && customerName.trim()) || 
                 (isCashPaymentValid && customerName.trim());

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
                Order {orderNumber} for {customerName}
                {paymentMethod === 'cash' && <><br />Change due: {formatCurrency(change)}</>}
            </DialogDescription>
            <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
              <Printer className="h-4 w-4" />
              <span>Receipts printing...</span>
            </div>
             <p className="mt-4 text-sm text-muted-foreground">Thank you for your order.</p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl">Checkout</DialogTitle>
              <DialogDescription>
                Order {orderNumber} for {customerName || 'Customer'}<br />
                Total amount to be paid:
                <span className="font-bold text-foreground"> {formatCurrency(total)}</span>
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
                      Change due: {formatCurrency(change)}
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
