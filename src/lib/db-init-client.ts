'use client';

/**
 * This is a safe client-side stub for db-init.ts
 * It exports the same interface but doesn't actually do anything database-related
 * This prevents errors when client components import database initialization code
 */

export const initializeDatabase = async (): Promise<void> => {
  // No-op on client side
  return Promise.resolve();
};
