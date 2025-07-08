import type { RestaurantSettings } from './types';

/**
 * Generates a unique order number with prefix based on restaurant settings
 * Format: [PREFIX]-[4-digit-number]
 * Examples: "BIS-1234", "ADV-5678"
 */
export function generateOrderNumber(
  restaurantSettings: RestaurantSettings, 
  isAdvanceOrder: boolean = false
): string {
  const prefix = isAdvanceOrder 
    ? (restaurantSettings.advanceOrderPrefix || getDefaultPrefix(restaurantSettings.name, 'advance'))
    : (restaurantSettings.orderPrefix || getDefaultPrefix(restaurantSettings.name, 'regular'));
    
  // Generate 4-digit random number
  const orderNumber = Math.floor(1000 + Math.random() * 9000);
  
  return `${prefix}-${orderNumber}`;
}

/**
 * Generates default prefix from restaurant name
 * Takes first 3 characters of restaurant name, uppercased
 */
function getDefaultPrefix(restaurantName: string, type: 'regular' | 'advance'): string {
  if (!restaurantName) {
    return type === 'advance' ? 'ADV' : 'ORD';
  }
  
  // Extract first 3 characters, remove spaces and special characters
  const cleanName = restaurantName.replace(/[^a-zA-Z]/g, '').toUpperCase();
  const basePrefix = cleanName.substring(0, 3).padEnd(3, 'X'); // Pad with X if less than 3 chars
  
  // For advance orders, add 'A' prefix or modify the prefix
  return type === 'advance' ? `A${basePrefix.substring(0, 2)}` : basePrefix;
}

/**
 * Validates if an order number follows the correct format
 */
export function validateOrderNumber(orderNumber: string): boolean {
  // Format: XXX-XXXX (3 letters, dash, 4 digits)
  const orderNumberRegex = /^[A-Z]{3}-\d{4}$/;
  return orderNumberRegex.test(orderNumber);
}

/**
 * Extracts prefix from order number
 */
export function extractOrderPrefix(orderNumber: string): string | null {
  const match = orderNumber.match(/^([A-Z]{3})-\d{4}$/);
  return match ? match[1] : null;
}
