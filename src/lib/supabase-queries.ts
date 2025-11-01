import { supabase, createServiceClient } from './supabase'
import type { Product, Order, OrderItem, Transaction, OrderStatus } from './types'

// Simple cache for queries
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<any>>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function getCachedData<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && (Date.now() - entry.timestamp) < CACHE_DURATION) {
    return entry.data;
  }
  cache.delete(key);
  return null;
}

function setCachedData<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

function invalidateCache(pattern: string): void {
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
}

// Product functions
export async function getProducts(): Promise<Product[]> {
  const cacheKey = 'available_products';
  const cached = getCachedData<Product[]>(cacheKey);
  if (cached) return cached;

  const { data, error } = await supabase
    .from('products')
    .select('id, name, price, category, image_url, description, is_available') // Only select needed fields
    .eq('is_available', true)
    .order('category')
    .order('name')
    .limit(50) // Limit results for faster loading

  if (error) {
    console.error('Error fetching products:', error)
    return []
  }

  const products = data.map(product => ({
    id: product.id,
    name: product.name,
    price: product.price,
    category: product.category,
    imageUrl: product.image_url || null, // Don't generate URLs here, let components handle it
    imageHint: product.description || product.name,
    isAvailable: product.is_available
  }));

  setCachedData(cacheKey, products);
  return products;
}

export async function getAllProducts(): Promise<Product[]> {
  const cacheKey = 'all_products';
  const cached = getCachedData<Product[]>(cacheKey);
  if (cached) return cached;

  try {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, price, category, image_url, description, is_available')
      .order('name')
      .limit(25) // Reduced to 25 for faster loading

    if (error) {
      console.error('Error fetching all products:', error)
      return []
    }

    const products = data?.map(product => ({
      id: product.id,
      name: product.name,
      price: product.price,
      category: product.category,
      imageUrl: product.image_url || null, // Don't generate placeholder URLs here
      imageHint: product.description || product.name,
      isAvailable: product.is_available
    })) || [];

    setCachedData(cacheKey, products);
    return products;
  } catch (error) {
    console.error('Exception in getAllProducts:', error)
    return []
  }
}

export async function createProduct(product: Omit<Product, 'id'>): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .insert({
      name: product.name,
      price: product.price,
      category: product.category,
      image_url: product.imageUrl,
      description: product.imageHint,
      is_available: product.isAvailable
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating product:', error)
    return null
  }

  // Invalidate product caches
  invalidateCache('products');

  return {
    id: data.id,
    name: data.name,
    price: data.price,
    category: data.category,
    imageUrl: data.image_url || `/api/placeholder/300/200?text=${encodeURIComponent(data.name)}`,
    imageHint: data.description || data.name,
    isAvailable: data.is_available
  }
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<boolean> {
  const { error } = await supabase
    .from('products')
    .update({
      ...(updates.name && { name: updates.name }),
      ...(updates.price && { price: updates.price }),
      ...(updates.category && { category: updates.category }),
      ...(updates.imageUrl && { image_url: updates.imageUrl }),
      ...(updates.imageHint && { description: updates.imageHint }),
      ...(updates.isAvailable !== undefined && { is_available: updates.isAvailable })
    })
    .eq('id', id)

  if (error) {
    console.error('Error updating product:', error)
    return false
  }

  // Invalidate product caches
  invalidateCache('products');

  return true
}

export async function deleteProduct(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting product:', error)
    return false
  }

  // Invalidate product caches
  invalidateCache('products');

  return true
}

// Order functions
export async function createOrder(
  customerName: string,
  items: OrderItem[],
  paymentMethod: 'cash' | 'digital',
  amountTendered?: number
): Promise<{ orderId: string; orderNumber: string } | null> {
  try {
    const itemsData = items.map(item => ({
      product_id: item.product.id,
      quantity: item.quantity
    }))

    const { data, error } = await supabase.rpc('create_order', {
      customer_name: customerName,
      items: itemsData,
      payment_method: paymentMethod,
      amount_tendered: amountTendered
    })

    if (error) {
      console.error('Error creating order:', error)
      return null
    }

    // Get the order details to return order number
    const { data: orderData, error: fetchError } = await supabase
      .from('orders')
      .select('order_number')
      .eq('id', data)
      .single()

    if (fetchError) {
      console.error('Error fetching order details:', fetchError)
      return null
    }

    return {
      orderId: data,
      orderNumber: orderData.order_number
    }
  } catch (error) {
    console.error('Error in createOrder:', error)
    return null
  }
}

export async function getActiveOrders(): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        *,
        product:products (*)
      )
    `)
    .neq('status', 'completed')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching active orders:', error)
    return []
  }

  return data.map(order => ({
    id: order.id,
    orderNumber: order.order_number,
    customerName: order.customer_name,
    items: order.order_items.map((item: any) => ({
      product: {
        id: item.product.id,
        name: item.product_name, // Use name from order time
        price: item.product_price, // Use price from order time
        category: item.product.category,
        imageUrl: item.product.image_url || `/api/placeholder/300/200?text=${encodeURIComponent(item.product_name)}`,
        imageHint: item.product.description || item.product_name,
        isAvailable: item.product.is_available
      },
      quantity: item.quantity
    })),
    subtotal: order.subtotal,
    total: order.total,
    status: order.status as OrderStatus,
    createdAt: new Date(order.created_at),
    updatedAt: new Date(order.updated_at)
  }))
}

export async function updateOrderStatus(orderId: string, status: OrderStatus, kitchenNotes?: string): Promise<boolean> {
  const { error } = await supabase.rpc('update_order_status', {
    order_id: orderId,
    new_status: status,
    kitchen_notes: kitchenNotes
  })

  if (error) {
    console.error('Error updating order status:', error)
    return false
  }

  return true
}

// Transaction functions
export async function getTransactions(startDate?: Date, endDate?: Date): Promise<Transaction[]> {
  let query = supabase
    .from('transactions')
    .select(`
      *,
      order:orders (
        *,
        order_items (
          *,
          product:products (*)
        )
      )
    `)
    .order('processed_at', { ascending: false })

  if (startDate) {
    query = query.gte('processed_at', startDate.toISOString())
  }

  if (endDate) {
    query = query.lte('processed_at', endDate.toISOString())
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching transactions:', error)
    return []
  }

  return data.map(transaction => ({
    id: transaction.id,
    order: {
      id: transaction.order.id,
      orderNumber: transaction.order.order_number,
      customerName: transaction.order.customer_name,
      items: transaction.order.order_items.map((item: any) => ({
        product: {
          id: item.product.id,
          name: item.product_name,
          price: item.product_price,
          category: item.product.category,
          imageUrl: item.product.image_url || `/api/placeholder/300/200?text=${encodeURIComponent(item.product_name)}`,
          imageHint: item.product.description || item.product_name,
          isAvailable: item.product.is_available
        },
        quantity: item.quantity
      })),
      subtotal: transaction.order.subtotal,
      total: transaction.order.total,
      status: transaction.order.status as OrderStatus,
      createdAt: new Date(transaction.order.created_at),
      updatedAt: new Date(transaction.order.updated_at)
    },
    paymentMethod: transaction.payment_method as 'cash' | 'digital',
    amountTendered: transaction.amount_tendered,
    changeGiven: transaction.change_given,
    timestamp: new Date(transaction.processed_at)
  }))
}

// Utility functions
export function getCategories(): string[] {
  return ['Sandwiches', 'Sides', 'Drinks', 'Snacks']
}

// Image upload function
export async function uploadProductImage(file: File, productId: string): Promise<string | null> {
  const fileExt = file.name.split('.').pop()
  const fileName = `${productId}-${Date.now()}.${fileExt}`
  const filePath = `products/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('product-images')
    .upload(filePath, file)

  if (uploadError) {
    console.error('Error uploading image:', uploadError)
    return null
  }

  const { data } = supabase.storage
    .from('product-images')
    .getPublicUrl(filePath)

  return data.publicUrl
}

// Real-time subscriptions
export function subscribeToOrderUpdates(callback: (orders: Order[]) => void) {
  const subscription = supabase
    .channel('orders-changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'orders'
    }, () => {
      // Refresh orders when any order changes
      getActiveOrders().then(callback)
    })
    .subscribe()

  return () => {
    subscription.unsubscribe()
  }
}

// Cache utilities for manual invalidation
export function clearAllCache(): void {
  cache.clear();
}

export function clearProductCache(): void {
  invalidateCache('products');
}