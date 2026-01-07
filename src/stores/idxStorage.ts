// SPDX-License-Identifier: GPL-2.0-only
// Copyright (c) 2026 GoodMultitracks contributors
import { StateStorage } from 'zustand/middleware';
import { indexedDB } from '../lib/indexedDBManager';

/**
 * Custom storage adapter to persist Zustand state to IndexedDB
 * preventing QuotaExceededError from LocalStorage
 */
export const idxStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      // We use the 'preferences' store which is key-value based
      const item = await indexedDB.get<{ key: string, value: string }>('preferences', name);
      return item?.value || null;
    } catch (error) {
      console.warn('Failed to load state from IndexedDB:', error);
      return null;
    }
  },
  
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await indexedDB.set('preferences', { key: name, value });
    } catch (error) {
      console.error('Failed to save state to IndexedDB:', error);
    }
  },
  
  removeItem: async (name: string): Promise<void> => {
    try {
      await indexedDB.delete('preferences', name);
    } catch (error) {
      console.warn('Failed to remove state from IndexedDB:', error);
    }
  },
};
