'use client';

import * as React from 'react';
import { OrderProvider } from '@/contexts/OrderContext';
import { getProducts, getCategories } from '@/lib/data';
import type { Product } from '@/lib/types';

import PosHeader from '@/components/pos/PosHeader';
import CategoryTabs from '@/components/pos/CategoryTabs';
import ProductGrid from '@/components/pos/ProductGrid';
import OrderSummary from '@/components/pos/OrderSummary';
import AISuggestions from '@/components/pos/AISuggestions';

export default function PosPage() {
  const [products] = React.useState<Product[]>(getProducts());
  const [categories] = React.useState<string[]>(getCategories());
  const [selectedCategory, setSelectedCategory] = React.useState<string>(
    categories[0]
  );

  const filteredProducts = products.filter(
    (product) => product.category === selectedCategory
  );

  return (
    <OrderProvider>
      <div className="flex h-screen flex-col bg-background">
        <PosHeader />
        <main className="flex flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            <CategoryTabs
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
            <ProductGrid products={filteredProducts} />
          </div>
          <aside className="w-full max-w-sm flex-shrink-0 border-l border-border bg-card shadow-lg">
            <div className="flex h-full flex-col">
              <OrderSummary />
              <AISuggestions />
            </div>
          </aside>
        </main>
      </div>
    </OrderProvider>
  );
}
