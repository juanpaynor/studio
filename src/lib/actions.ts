'use client';
import type { SalesData } from './types';

function convertToCSV(data: SalesData[]): string {
  const header = ['Date', 'Sales'];
  const rows = data.map(row => [row.date, row.sales.toFixed(2)]);
  
  return [
    header.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
}

export function downloadSalesCSV(data: SalesData[]) {
  const csvString = convertToCSV(data);
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'sales_report.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
