'use client';

import * as React from 'react';
import { OrderProvider } from '@/contexts/OrderContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { getCategories } from '@/lib/data';
import { getProducts } from '@/lib/supabase-queries';
import type { Product } from '@/lib/types';

import PosHeader from '@/components/pos/PosHeader';
import CategoryTabs from '@/components/pos/CategoryTabs';
import ProductGrid from '@/components/pos/ProductGrid';
import OrderSummary from '@/components/pos/OrderSummary';

// Enhanced cache with better management
let cachedProducts: Product[] | null = null;
let lastFetch = 0;
const CACHE_DURATION = 10 * 60 * 1000; // Increased to 10 minutes
const categories = getCategories(); // Move outside component to prevent re-creation

export default function PosPage() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedCategory, setSelectedCategory] = React.useState<string>(categories[0]);

  const fetchProducts = React.useCallback(async () => {
    const now = Date.now();
    
    // Use cache if it's fresh
    if (cachedProducts && (now - lastFetch) < CACHE_DURATION) {
      setProducts(cachedProducts);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await getProducts();
      cachedProducts = data;
      lastFetch = now;
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
      // Don't clear existing products on error if we have cached data
      if (!cachedProducts) {
        setProducts([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize with cached data immediately if available
  React.useEffect(() => {
    if (cachedProducts && (Date.now() - lastFetch) < CACHE_DURATION) {
      setProducts(cachedProducts);
      setLoading(false);
    } else {
      fetchProducts();
    }
  }, [fetchProducts]);

  // Memoize filtered products with better performance
  const filteredProducts = React.useMemo(() => {
    if (!products.length) return [];
    return products.filter(
      (product) => product.category === selectedCategory && product.isAvailable
    );
  }, [products, selectedCategory]);

  // Show loading only if no cached data is available
  if (loading && products.length === 0) {
    return (
      <ProtectedRoute allowedRoles={['cashier', 'admin']}>
        <div className="flex h-screen items-center justify-center bg-background">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mb-4 mx-auto"></div>
            <p className="text-muted-foreground">Loading products...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['cashier', 'admin']}>
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
              <OrderSummary />
            </aside>
          </main>
        </div>
      </OrderProvider>
    </ProtectedRoute>
  );
}
