'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SalesChart } from './SalesChart';
import { getTransactions } from '@/lib/data';
import type { SalesData, Transaction } from '@/lib/types';
import { format, startOfWeek, startOfMonth, getWeek, getMonth, getYear } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { downloadSalesCSV } from '@/lib/actions';
import { formatCurrency } from '@/lib/utils';

type Period = 'daily' | 'weekly' | 'monthly';

interface SalesViewProps {
  period: Period;
}

const aggregateSales = (transactions: Transaction[], period: Period): SalesData[] => {
  const salesMap: { [key: string]: number } = {};

  transactions.forEach(tx => {
    let key = '';
    const date = tx.timestamp;

    switch (period) {
      case 'daily':
        key = format(date, 'yyyy-MM-dd');
        break;
      case 'weekly':
        const weekStart = startOfWeek(date, { weekStartsOn: 1 });
        key = `${getYear(weekStart)}-W${getWeek(weekStart, { weekStartsOn: 1 })}`;
        break;
      case 'monthly':
        key = format(date, 'yyyy-MM');
        break;
    }

    if (!salesMap[key]) {
      salesMap[key] = 0;
    }
    salesMap[key] += tx.order.total;
  });

  return Object.entries(salesMap)
    .map(([date, sales]) => ({ date, sales }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

export function SalesView({ period }: SalesViewProps) {
  const transactions = getTransactions();
  const salesData = aggregateSales(transactions, period);
  const totalSales = salesData.reduce((acc, item) => acc + item.sales, 0);

  const handleDownload = () => {
    downloadSalesCSV(salesData);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="capitalize">{period} Sales</CardTitle>
                <CardDescription>
                    Total sales for this period: {formatCurrency(totalSales)}
                </CardDescription>
            </div>
            <Button onClick={handleDownload} variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Download CSV
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        <SalesChart data={salesData} />
      </CardContent>
    </Card>
  );
}
