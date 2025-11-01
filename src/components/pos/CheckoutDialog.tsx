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
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { CreditCard, DollarSign, CheckCircle, Printer, Receipt, Calculator, Clock } from 'lucide-react';
import { useOrder } from '@/contexts/OrderContext';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
import { createOrder, markReceiptPrinted } from '@/lib/supabase-queries';
import { generateCustomerReceipt, generateKitchenReceipt, printReceipt, previewReceipt } from '@/lib/receipt';
import type { ReceiptData } from '@/lib/receipt';

export default function CheckoutDialog() {
  const { total, orderItems, customerName, orderNumber, subtotal, clearOrder, setSubmitting } = useOrder();
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'digital'>('digital');
  const [amountTendered, setAmountTendered] = useState('');
  const [change, setChange] = useState(0);
  const [isPaid, setIsPaid] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [open, setOpen] = useState(false);
  const [lastReceiptData, setLastReceiptData] = useState<any>(null);
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

  const handlePayment = async () => {
    if (!customerName.trim()) {
      toast({
        title: "Customer name required",
        description: "Please enter a customer name before checkout.",
        variant: "destructive",
      });
      return;
    }

    if (orderItems.length === 0) {
      toast({
        title: "Error",
        description: "Cannot process payment for empty order",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setSubmitting(true);

    try {
      // Create order with sale and receipt data
      const result = await createOrder(
        customerName || 'Walk-in Customer',
        orderItems,
        paymentMethod === 'digital' ? 'digital' : 'cash',
        paymentMethod === 'cash' ? parseFloat(amountTendered) : undefined
      );

      // The function now throws on error, so if we get here, result should be valid
      if (!result) {
        throw new Error('No result returned from createOrder');
      }

      if (result?.receiptData) {
        // Store receipt data for preview
        setLastReceiptData(result.receiptData);
        
        // Generate and print receipts asynchronously (don't wait)
        setTimeout(() => {
          try {
            const customerReceipt = generateCustomerReceipt(result.receiptData);
            const kitchenReceipt = generateKitchenReceipt(result.receiptData);
            
            printReceipt(customerReceipt, 'customer');
            printReceipt(kitchenReceipt, 'kitchen');
            
            // Mark as printed (fire and forget)
            if (result.saleId) {
              markReceiptPrinted(result.saleId);
            }
          } catch (err) {
            console.error('Receipt generation error:', err);
          }
        }, 100); // Print after UI updates
      }

      setIsPaid(true);
      
      toast({
        title: "Payment Successful!",
        description: `Receipt ${result?.receiptData?.receiptNumber || orderNumber}`,
      });

      // Clear order after successful payment - FASTER!
      setTimeout(() => {
        clearOrder();
        setIsPaid(false);
        setOpen(false);
        setAmountTendered('');
        setChange(0);
        setPaymentMethod('digital');
      }, 1500); // Reduced from 2000ms

    } catch (error) {
      console.error('Payment processing error:', error);
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "An error occurred while processing payment",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setSubmitting(false);
    }
  };
  
  const isCashPaymentValid = paymentMethod === 'cash' && parseFloat(amountTendered) >= total;
  const canPay = (paymentMethod === 'digital' && total > 0 && customerName.trim()) || 
                 (isCashPaymentValid && customerName.trim());

  const handlePreviewReceipt = () => {
    if (lastReceiptData) {
      const customerReceipt = generateCustomerReceipt(lastReceiptData);
      previewReceipt(customerReceipt, 'customer');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className="mt-4 w-full bg-accent text-accent-foreground hover:bg-accent/90"
          size="lg"
          disabled={orderItems.length === 0}
        >
          <Receipt className="mr-2 h-5 w-5" />
          Checkout ({orderItems.length} items)
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        {isPaid ? (
          <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="relative">
              <CheckCircle className="h-24 w-24 text-green-500 animate-pulse" />
              <div className="absolute -top-2 -right-2 h-8 w-8 bg-green-100 rounded-full animate-ping"></div>
            </div>
            <DialogTitle className="text-2xl text-green-700">Payment Confirmed!</DialogTitle>
            <Card className="w-full">
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Order:</span>
                  <Badge variant="secondary">{orderNumber}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Customer:</span>
                  <span className="font-medium">{customerName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Paid:</span>
                  <span className="font-bold text-lg">{formatCurrency(total)}</span>
                </div>
                {paymentMethod === 'cash' && change > 0 && (
                  <div className="flex justify-between items-center text-orange-600">
                    <span className="text-sm font-medium">Change Due:</span>
                    <span className="font-bold">{formatCurrency(change)}</span>
                  </div>
                )}
              </CardContent>
            </Card>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Printer className="h-4 w-4 animate-bounce" />
              <span>Receipts printing...</span>
            </div>
            {lastReceiptData && (
              <Button 
                variant="outline" 
                onClick={handlePreviewReceipt}
                className="mt-4"
              >
                <Receipt className="mr-2 h-4 w-4" />
                Preview Receipt
              </Button>
            )}
            <p className="text-sm text-muted-foreground">Thank you for your order!</p>
          </div>
        ) : (
          <div className="space-y-6">
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center gap-2">
                <Receipt className="h-6 w-6" />
                Checkout
              </DialogTitle>
              <DialogDescription>
                Complete your order for {customerName || 'Customer'}
              </DialogDescription>
            </DialogHeader>

            {/* Order Summary */}
            <Card>
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold">Order Summary</h3>
                  <Badge variant="outline">{orderNumber}</Badge>
                </div>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {orderItems.map((item, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span>{item.quantity}× {item.product.name}</span>
                      <span className="font-medium">{formatCurrency(item.quantity * item.product.price)}</span>
                    </div>
                  ))}
                </div>
                <Separator className="my-3" />
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Subtotal:</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center font-bold text-lg">
                    <span>Total:</span>
                    <span className="text-green-600">{formatCurrency(total)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Payment Method</Label>
              <RadioGroup value={paymentMethod} onValueChange={(value: 'cash' | 'digital') => setPaymentMethod(value)}>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                    <RadioGroupItem value="digital" id="digital" />
                    <Label htmlFor="digital" className="flex items-center gap-2 cursor-pointer">
                      <CreditCard className="h-4 w-4" />
                      Card/Digital
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                    <RadioGroupItem value="cash" id="cash" />
                    <Label htmlFor="cash" className="flex items-center gap-2 cursor-pointer">
                      <DollarSign className="h-4 w-4" />
                      Cash
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {/* Cash Payment Details */}
            {paymentMethod === 'cash' && (
              <Card className="border-orange-200 bg-orange-50/50">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center gap-2 text-orange-700 font-medium">
                    <Calculator className="h-4 w-4" />
                    Cash Payment Details
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount-tendered">Amount Tendered</Label>
                    <Input
                      id="amount-tendered"
                      type="number"
                      step="0.01"
                      min={total}
                      placeholder={`Minimum: ${formatCurrency(total)}`}
                      value={amountTendered}
                      onChange={(e) => setAmountTendered(e.target.value)}
                      className="text-lg font-mono"
                    />
                  </div>
                  {change > 0 && (
                    <div className="flex justify-between items-center p-3 bg-orange-100 rounded-lg">
                      <span className="font-medium text-orange-700">Change Due:</span>
                      <span className="font-bold text-lg text-orange-700">{formatCurrency(change)}</span>
                    </div>
                  )}
                  {amountTendered && parseFloat(amountTendered) < total && (
                    <p className="text-sm text-red-600">
                      Insufficient amount. Need at least {formatCurrency(total)}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            <DialogFooter>
              <Button 
                onClick={handlePayment} 
                disabled={!canPay || isProcessing} 
                className="w-full text-lg py-6"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Clock className="mr-2 h-5 w-5 animate-spin" />
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Confirm Payment • {formatCurrency(total)}
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
