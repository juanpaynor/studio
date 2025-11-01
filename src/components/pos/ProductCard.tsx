'use client';

import Image from 'next/image';
import type { Product } from '@/lib/types';
import { useOrder } from '@/contexts/OrderContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn, formatCurrency } from '@/lib/utils';
import React from 'react';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useOrder();
  const [isClicked, setIsClicked] = React.useState(false);

  const handleClick = React.useCallback(() => {
    if (!product.isAvailable) return;
    
    addItem(product);
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 200);
  }, [addItem, product]);

  // Generate placeholder URL only when needed
  const imageUrl = React.useMemo(() => {
    return product.imageUrl || `/api/placeholder/200/150?text=${encodeURIComponent(product.name.charAt(0))}`;
  }, [product.imageUrl, product.name]);

  return (
    <Card
      className={cn(
        'cursor-pointer overflow-hidden transition-transform duration-200 ease-in-out hover:shadow-lg hover:-translate-y-1',
        isClicked ? 'scale-95' : '',
        !product.isAvailable ? 'opacity-50 cursor-not-allowed' : ''
      )}
      onClick={handleClick}
    >
      <CardContent className="flex aspect-square flex-col justify-between p-0">
        <div className="relative h-2/3 w-full bg-gray-100">
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 20vw, 15vw"
            className="object-cover"
            data-ai-hint={product.imageHint}
            loading="lazy"
            onError={(e) => {
              // Fallback to text placeholder if image fails
              const target = e.target as HTMLImageElement;
              target.src = `/api/placeholder/200/150?text=${encodeURIComponent(product.name.charAt(0))}`;
            }}
          />
          {!product.isAvailable && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <Badge variant="destructive">Out of Stock</Badge>
            </div>
          )}
        </div>
        <div className="flex flex-col p-3">
          <h3 className="font-semibold text-sm leading-tight">{product.name}</h3>
          <p className="text-sm text-muted-foreground font-medium">
            {formatCurrency(product.price)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
