'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getAllProducts } from '@/lib/supabase-queries';
import { ProductDataTable } from '@/components/admin/products/ProductDataTable';
import { createProductColumns } from '@/components/admin/products/ProductColumns';
import { ProductTableSkeleton } from '@/components/admin/products/ProductTableSkeleton';
import type { Product } from '@/lib/types';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

// Optimized cache for admin products
let cachedAllProducts: Product[] | null = null;
let lastAdminFetch = 0;
const ADMIN_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes for better performance

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProducts = useCallback(async (showRefreshing = false) => {
    const now = Date.now();
    
    // Use cache if it's fresh and not force refreshing
    if (!showRefreshing && cachedAllProducts && (now - lastAdminFetch) < ADMIN_CACHE_DURATION) {
      setProducts(cachedAllProducts);
      setLoading(false);
      return;
    }

    try {
      if (showRefreshing) setRefreshing(true);
      else setLoading(true);
      
      const data = await getAllProducts();
      cachedAllProducts = data || [];
      lastAdminFetch = now;
      setProducts(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products. Please try again.');
      setProducts([]); // Set empty array on error
    } finally {
      setLoading(false);
      if (showRefreshing) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // Initialize with cached data immediately if available
    if (cachedAllProducts && (Date.now() - lastAdminFetch) < ADMIN_CACHE_DURATION) {
      setProducts(cachedAllProducts);
      setLoading(false);
    } else {
      fetchProducts();
    }
  }, [fetchProducts]);

  const refreshProducts = useCallback(async () => {
    // Clear cache and force refresh
    cachedAllProducts = null;
    await fetchProducts(true);
  }, [fetchProducts]);

  // Memoize columns to prevent re-creation on every render
  const columns = useMemo(() => createProductColumns(refreshProducts), [refreshProducts]);

  // Show loading skeleton only if no cached data is available
  if (loading && products.length === 0) {
    return <ProductTableSkeleton />;
  }

  if (error && products.length === 0) {
    return (
      <div className="container mx-auto py-10">
        <h1 className="font-headline text-3xl font-bold mb-6">Product Management</h1>
        <Alert variant="destructive" className="mb-4">
          <AlertDescription className="flex items-center justify-between">
            {error}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setError(null);
                fetchProducts();
              }}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-headline text-3xl font-bold">Product Management</h1>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={refreshProducts}
          disabled={refreshing}
          className="transition-all duration-200"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>
      
      {/* Show error banner if there's an error but we have cached data */}
      {error && products.length > 0 && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <ProductDataTable 
        columns={columns} 
        data={products} 
        refreshData={refreshProducts}
      />
    </div>
  );
}
