// SPDX-License-Identifier: GPL-2.0-only
// Copyright (c) 2026 GoodMultitracks contributors
/**
 * IndexedDB Manager - Persistência de alto desempenho
 * 
 * CORREÇÃO CRÍTICA (QA): Substitui LocalStorage para dados grandes
 * - LocalStorage é síncrono e limitado a ~5MB
 * - IndexedDB é assíncrono, suporta GB de dados e estruturas complexas
 * 
 * USO RECOMENDADO:
 * - Projetos salvos localmente
 * - Cache de waveforms processadas
 * - Histórico de edições (undo/redo)
 * - Configurações de mix/presets
 */

interface DBConfig {
  name: string;
  version: number;
  stores: Record<string, IDBObjectStoreParameters>;
}

const DB_CONFIG: DBConfig = {
  name: 'GoodMultitracks',
  version: 1,
  stores: {
    projects: { keyPath: 'id', autoIncrement: false },
    waveforms: { keyPath: 'id', autoIncrement: false },
    preferences: { keyPath: 'key', autoIncrement: false },
    mixPresets: { keyPath: 'id', autoIncrement: false }
  }
};

class IndexedDBManager {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase> | null = null;

  /**
   * Inicializa o banco de dados
   */
  async init(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DB_CONFIG.name, DB_CONFIG.version);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(request.result);
      };

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Criar object stores se não existirem
        Object.entries(DB_CONFIG.stores).forEach(([storeName, options]) => {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, options);
          }
        });
      };
    });

    return this.initPromise;
  }

  /**
   * Salva um item no banco
   */
  async set<T>(storeName: string, value: T): Promise<void> {
    const db = await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(value);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`Failed to save to ${storeName}`));
    });
  }

  /**
   * Busca um item pelo ID
   */
  async get<T>(storeName: string, key: string): Promise<T | undefined> {
    const db = await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error(`Failed to get from ${storeName}`));
    });
  }

  /**
   * Lista todos os itens de uma store
   */
  async getAll<T>(storeName: string): Promise<T[]> {
    const db = await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error(`Failed to get all from ${storeName}`));
    });
  }

  /**
   * Remove um item
   */
  async delete(storeName: string, key: string): Promise<void> {
    const db = await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`Failed to delete from ${storeName}`));
    });
  }

  /**
   * Limpa todos os dados de uma store
   */
  async clear(storeName: string): Promise<void> {
    const db = await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`Failed to clear ${storeName}`));
    });
  }
}

// Singleton
export const indexedDB = new IndexedDBManager();

/**
 * MIGRATION GUIDE: LocalStorage → IndexedDB
 * 
 * ANTES (LocalStorage - Bloqueante):
 * ```typescript
 * localStorage.setItem('project', JSON.stringify(project)); // Bloqueia UI
 * const data = JSON.parse(localStorage.getItem('project') || '{}');
 * ```
 * 
 * DEPOIS (IndexedDB - Assíncrono):
 * ```typescript
 * await indexedDB.set('projects', project); // Não bloqueia
 * const data = await indexedDB.get('projects', projectId);
 * ```
 */

