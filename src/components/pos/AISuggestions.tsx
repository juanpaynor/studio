'use client';

import React, { useState, useEffect } from 'react';
import { useOrder } from '@/contexts/OrderContext';
import { suggestProductPairings } from '@/ai/flows/suggest-product-pairings';
import { getPastOrders, getProducts } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Wand2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AISuggestions() {
  const { orderItems, addItem } = useOrder();
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (orderItems.length === 0) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const pastOrders = getPastOrders();
        const allProducts = getProducts();

        const result = await suggestProductPairings({
          orderHistory: JSON.stringify(
            pastOrders.map((o) => o.items.map((i) => i.product.name))
          ),
          currentOrder: orderItems.map((item) => item.product.name),
          numberOfSuggestions: 3,
        });

        const suggestedProducts = result.suggestions
            .map(name => allProducts.find(p => p.name === name))
            .filter(Boolean)
            .map(p => p!.name);

        setSuggestions(suggestedProducts);
      } catch (e) {
        console.error('Failed to get suggestions:', e);
        setError('Could not load suggestions.');
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 500);
    return () => clearTimeout(debounceTimer);
  }, [orderItems]);

  const handleAddSuggestion = (suggestionName: string) => {
    const productToAdd = getProducts().find(p => p.name === suggestionName);
    if(productToAdd) {
        addItem(productToAdd);
    }
  };

  return (
    <div className="border-t p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-6 w-6 text-primary" />
            <span>You might also like...</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Finding perfect pairings...</span>
            </div>
          ) : error ? (
            <p className="text-center text-destructive">{error}</p>
          ) : suggestions.length > 0 ? (
            <div className="space-y-2">
              {suggestions.map((suggestion) => (
                <Button
                  key={suggestion}
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleAddSuggestion(suggestion)}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground">
              {orderItems.length > 0 ? 'No suggestions right now.' : 'Add items to see suggestions.'}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
