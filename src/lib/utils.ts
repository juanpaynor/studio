import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Currency formatting for Philippine Peso
export function formatCurrency(amount: number): string {
  return `₱${amount.toFixed(2)}`
}

// Generate order number with auto-increment
export function generateOrderNumber(orderCount: number): string {
  return `#${(orderCount + 1).toString().padStart(3, '0')}`
}

// Order status utilities
export const ORDER_STATUSES = {
  pending: 'Pending',
  preparing: 'Preparing',
  ready: 'Ready for Pickup',
  completed: 'Completed'
} as const
