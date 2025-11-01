'use client';

import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { getPastOrders } from '@/lib/data';
import type { Order } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Clock, ChefHat, CheckCircle, Package, ArrowLeft } from 'lucide-react';
import { ORDER_STATUSES, formatCurrency } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // In a real app, this would be a real-time subscription to Supabase
    const activeOrders = getPastOrders().filter(
      order => order.status !== 'completed'
    );
    setOrders(activeOrders);
  }, []);

  const updateOrderStatus = (orderId: string, newStatus: Order['status']) => {
    setOrders(prevOrders =>
      prevOrders.map(order =>
        order.id === orderId
          ? { ...order, status: newStatus, updatedAt: new Date() }
          : order
      )
    );

    const order = orders.find(o => o.id === orderId);
    if (order) {
      toast({
        title: "Order Status Updated",
        description: `Order ${order.orderNumber} is now ${ORDER_STATUSES[newStatus].toLowerCase()}`,
      });
    }

    // Remove completed orders after a delay
    if (newStatus === 'completed') {
      setTimeout(() => {
        setOrders(prevOrders => prevOrders.filter(order => order.id !== orderId));
      }, 3000);
    }
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'preparing':
        return <ChefHat className="h-4 w-4" />;
      case 'ready':
        return <Package className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500';
      case 'preparing':
        return 'bg-blue-500';
      case 'ready':
        return 'bg-green-500';
      case 'completed':
        return 'bg-gray-500';
    }
  };

  const getNextStatus = (currentStatus: Order['status']): Order['status'] | null => {
    switch (currentStatus) {
      case 'pending':
        return 'preparing';
      case 'preparing':
        return 'ready';
      case 'ready':
        return 'completed';
      default:
        return null;
    }
  };

  const getNextStatusLabel = (currentStatus: Order['status']): string => {
    const nextStatus = getNextStatus(currentStatus);
    return nextStatus ? ORDER_STATUSES[nextStatus] : '';
  };

  return (
    <ProtectedRoute allowedRoles={['kitchen', 'admin']}>
      <div className="container mx-auto p-6">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to POS
            </Link>
          </Button>
          <div>
            <h1 className="font-headline text-3xl font-bold mb-2">Kitchen Queue</h1>
            <p className="text-muted-foreground">
              Manage and track order status in real-time
            </p>
          </div>
        </div>

        {orders.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <ChefHat className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No Active Orders</h3>
              <p className="text-muted-foreground">
                All orders have been completed. Great job!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {orders.map((order) => (
              <Card key={order.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold">
                      {order.orderNumber}
                    </CardTitle>
                    <Badge 
                      className={`text-white ${getStatusColor(order.status)}`}
                    >
                      <div className="flex items-center gap-1">
                        {getStatusIcon(order.status)}
                        {ORDER_STATUSES[order.status]}
                      </div>
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Customer: <span className="font-medium">{order.customerName}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Ordered: {order.createdAt.toLocaleTimeString()}
                  </p>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{item.quantity}x {item.product.name}</span>
                      </div>
                    ))}
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    {getNextStatus(order.status) && (
                      <Button
                        onClick={() => updateOrderStatus(order.id, getNextStatus(order.status)!)}
                        className="w-full"
                        variant={order.status === 'ready' ? 'default' : 'outline'}
                      >
                        Mark as {getNextStatusLabel(order.status)}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}