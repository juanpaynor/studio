'use client';

import type { ColumnDef } from '@tanstack/react-table';
import type { Product } from '@/lib/types';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import Image from 'next/image';
import { ProductFormDialog } from './ProductFormDialog';
import { formatCurrency } from '@/lib/utils';

export const createProductColumns = (refreshData?: () => Promise<void>): ColumnDef<Product>[] => [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => {
      const product = row.original;
      return (
        <div className="flex items-center gap-4">
          <div className="relative w-10 h-10 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
            <Image
              src={product.imageUrl || `/api/placeholder/40/40?text=${encodeURIComponent(product.name.charAt(0))}`}
              alt={product.name}
              fill
              className="object-cover"
              data-ai-hint={product.imageHint}
              loading="lazy"
              sizes="40px"
              onError={(e) => {
                // Fallback to placeholder if image fails to load
                const target = e.target as HTMLImageElement;
                target.src = `/api/placeholder/40/40?text=${encodeURIComponent(product.name.charAt(0))}`;
              }}
            />
          </div>
          <span className="font-medium truncate max-w-[200px]">{product.name}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'category',
    header: 'Category',
  },
  {
    accessorKey: 'price',
    header: () => <div className="text-right">Price</div>,
    cell: ({ row }) => {
      const price = parseFloat(row.getValue('price'));
      return <div className="text-right font-medium">{formatCurrency(price)}</div>;
    },
  },
  {
    accessorKey: 'isAvailable',
    header: 'Status',
    cell: ({ row }) => {
      const isAvailable = row.getValue('isAvailable') as boolean;
      return (
        <Badge variant={isAvailable ? 'default' : 'destructive'}>
          {isAvailable ? 'Available' : 'Out of Stock'}
        </Badge>
      );
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const product = row.original;

      return (
        <div className="text-right">
            <ProductFormDialog product={product} onSuccess={refreshData}>
                <Button variant="ghost" className="h-8 w-8 p-0" asChild>
                    <span className="cursor-pointer">
                        <MoreHorizontal className="h-4 w-4" />
                    </span>
                </Button>
            </ProductFormDialog>
        </div>
      );
    },
  },
];

// For backward compatibility
export const productColumns = createProductColumns();
