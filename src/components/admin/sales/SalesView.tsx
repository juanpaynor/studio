'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SalesChart } from './SalesChart';
import { getSalesReport } from '@/lib/supabase-queries';
import type { SalesData } from '@/lib/types';
import { format, startOfWeek, startOfMonth, subDays, subWeeks, subMonths } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { generateCustomerReceipt, previewReceipt } from '@/lib/receipt';
import { Printer } from 'lucide-react';

type Period = 'daily' | 'weekly' | 'monthly';

interface SalesViewProps {
  period: Period;
}

interface Sale {
  id: string;
  receipt_number: string;
  order_number?: string;
  customer: string;
  sale_date: string;
  subtotal: number;
  total: number;
  payment_type: string;
  amount_paid: number;
  change_amount: number;
  printed: boolean;
  receipt_json?: any;
  items_count?: number;
}

export function SalesView({ period }: SalesViewProps) {
  const [sales, setSales] = React.useState<Sale[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [chartData, setChartData] = React.useState<SalesData[]>([]);
  
  const fetchSales = React.useCallback(async () => {
    setLoading(true);
    try {
      // Calculate date range based on period
      const endDate = new Date().toISOString();
      let startDate: string;
      
      switch (period) {
        case 'daily':
          startDate = subDays(new Date(), 7).toISOString(); // Last 7 days
          break;
        case 'weekly':
          startDate = subWeeks(new Date(), 4).toISOString(); // Last 4 weeks
          break;
        case 'monthly':
          startDate = subMonths(new Date(), 6).toISOString(); // Last 6 months
          break;
      }
      
      const data = await getSalesReport(startDate, endDate);
      setSales(data || []);
      
      // Aggregate for chart
      const aggregated = aggregateSales(data || [], period);
      setChartData(aggregated);
    } catch (error) {
      console.error('Error fetching sales:', error);
      setSales([]);
      setChartData([]);
    } finally {
      setLoading(false);
    }
  }, [period]);
  
  React.useEffect(() => {
    fetchSales();
  }, [fetchSales]);
  
  const totalSales = sales.reduce((acc, sale) => acc + sale.total, 0);
  const totalTransactions = sales.length;

  const handleDownload = () => {
    // Create CSV content
    const headers = ['Date', 'Receipt #', 'Order #', 'Customer', 'Items', 'Subtotal', 'Total', 'Payment', 'Amount Paid', 'Change'];
    const rows = sales.map(sale => [
      format(new Date(sale.sale_date), 'yyyy-MM-dd HH:mm:ss'),
      sale.receipt_number,
      sale.order_number || 'N/A',
      sale.customer,
      sale.items_count || '0',
      sale.subtotal.toFixed(2),
      sale.total.toFixed(2),
      sale.payment_type,
      sale.amount_paid?.toFixed(2) || '0.00',
      sale.change_amount?.toFixed(2) || '0.00'
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sales-${period}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleReprintReceipt = (sale: Sale) => {
    try {
      // Use receipt_json if available, otherwise construct from sale data
      const receiptData = sale.receipt_json || {
        receipt_number: sale.receipt_number,
        order_number: sale.order_number || 'N/A',
        customer_name: sale.customer,
        sale_date: sale.sale_date,
        subtotal: sale.subtotal,
        total: sale.total,
        payment_method: sale.payment_type,
        amount_tendered: sale.amount_paid,
        change_given: sale.change_amount,
        items: [] // Will be empty if no receipt_json
      };
      
      const receipt = generateCustomerReceipt(receiptData);
      previewReceipt(receipt, 'customer');
    } catch (error) {
      console.error('Error reprinting receipt:', error);
      alert('Error generating receipt. Please try again.');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <RefreshCw className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="capitalize">{period} Sales</CardTitle>
              <CardDescription>
                {totalTransactions} transactions • Total: {formatCurrency(totalSales)}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={fetchSales} variant="outline" size="sm">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <Button onClick={handleDownload} variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Download CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <SalesChart data={chartData} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>Click on any transaction to reprint the receipt</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>Receipt #</TableHead>
                <TableHead>Order #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    No sales data available for this period
                  </TableCell>
                </TableRow>
              ) : (
                sales.map((sale) => (
                  <TableRow 
                    key={sale.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleReprintReceipt(sale)}
                  >
                    <TableCell className="font-medium">
                      {format(new Date(sale.sale_date), 'MMM dd, yyyy')}
                      <br />
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(sale.sale_date), 'HH:mm:ss')}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{sale.receipt_number}</TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {sale.order_number || 'N/A'}
                    </TableCell>
                    <TableCell>{sale.customer}</TableCell>
                    <TableCell className="text-center">{sale.items_count || 0}</TableCell>
                    <TableCell className="text-right">{formatCurrency(sale.subtotal)}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(sale.total)}</TableCell>
                    <TableCell>
                      <span className="capitalize inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary">
                        {sale.payment_type}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReprintReceipt(sale);
                        }}
                        title="Reprint receipt"
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

const aggregateSales = (sales: Sale[], period: Period): SalesData[] => {
  const salesMap: { [key: string]: number } = {};

  sales.forEach(sale => {
    let key = '';
    const date = new Date(sale.sale_date);

    switch (period) {
      case 'daily':
        key = format(date, 'MMM dd');
        break;
      case 'weekly':
        const weekStart = startOfWeek(date, { weekStartsOn: 1 });
        key = format(weekStart, 'MMM dd');
        break;
      case 'monthly':
        key = format(date, 'MMM yyyy');
        break;
    }

    if (!salesMap[key]) {
      salesMap[key] = 0;
    }
    salesMap[key] += sale.total;
  });

  return Object.entries(salesMap)
    .map(([date, sales]) => ({ date, sales }))
    .sort((a, b) => {
      // Simple string comparison should work for our formatted dates
      return a.date.localeCompare(b.date);
    });
};
