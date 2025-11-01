'use client';

import Image from 'next/image';
import type { Product } from '@/lib/types';
import { useOrder } from '@/contexts/OrderContext';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import React from 'react';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useOrder();
  const [isClicked, setIsClicked] = React.useState(false);

  const handleClick = () => {
    addItem(product);
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 200);
  };

  return (
    <Card
      className={cn(
        'cursor-pointer overflow-hidden transition-transform duration-200 ease-in-out hover:shadow-lg hover:-translate-y-1',
        isClicked ? 'scale-95' : ''
      )}
      onClick={handleClick}
    >
      <CardContent className="flex aspect-square flex-col justify-between p-0">
        <div className="relative h-2/3 w-full">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 20vw, 15vw"
            className="object-cover"
            data-ai-hint={product.imageHint}
          />
        </div>
        <div className="flex flex-col p-3">
          <h3 className="font-semibold">{product.name}</h3>
          <p className="text-sm text-muted-foreground">
            ${product.price.toFixed(2)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
