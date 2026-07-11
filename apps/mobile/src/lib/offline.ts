import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

/**
 * Offline-First Architecture
 * Enables app to work seamlessly without internet connection
 */

interface QueuedRequest {
  id: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  headers?: Record<string, string>;
  timestamp: number;
  retryCount: number;
}

interface CachedData<T = any> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

/**
 * Offline Storage Manager
 */
export class OfflineStorage {
  private static readonly QUEUE_KEY = '@hustl:offline_queue';
  private static readonly CACHE_PREFIX = '@hustl:cache:';

  /**
   * Save data to offline storage
   */
  static async save<T>(key: string, data: T, ttl: number = 3600000): Promise<void> {
    const cached: CachedData<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl,
    };

    await AsyncStorage.setItem(
      `${this.CACHE_PREFIX}${key}`,
      JSON.stringify(cached)
    );
  }

  /**
   * Get data from offline storage
   */
  static async get<T>(key: string): Promise<T | null> {
    try {
      const item = await AsyncStorage.getItem(`${this.CACHE_PREFIX}${key}`);
      
      if (!item) return null;

      const cached: CachedData<T> = JSON.parse(item);

      // Check if expired
      if (Date.now() > cached.expiresAt) {
        await this.remove(key);
        return null;
      }

      return cached.data;
    } catch (error) {
      console.error('Error getting from offline storage:', error);
      return null;
    }
  }

  /**
   * Remove data from offline storage
   */
  static async remove(key: string): Promise<void> {
    await AsyncStorage.removeItem(`${this.CACHE_PREFIX}${key}`);
  }

  /**
   * Clear all cached data
   */
  static async clearAll(): Promise<void> {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((key: string) => key.startsWith(this.CACHE_PREFIX));
    await AsyncStorage.multiRemove(cacheKeys);
  }

  /**
   * Get cache size
   */
  static async getCacheSize(): Promise<number> {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((key: string) => key.startsWith(this.CACHE_PREFIX));
    
    let totalSize = 0;
    for (const key of cacheKeys) {
      const item = await AsyncStorage.getItem(key);
      if (item) {
        totalSize += new Blob([item]).size;
      }
    }

    return totalSize;
  }
}

/**
 * Request Queue Manager
 */
export class RequestQueue {
  private static queue: QueuedRequest[] = [];
  private static isProcessing = false;
  private static readonly MAX_RETRIES = 3;

  /**
   * Initialize queue from storage
   */
  static async initialize(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(OfflineStorage['QUEUE_KEY']);
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error initializing request queue:', error);
    }
  }

  /**
   * Add request to queue
   */
  static async enqueue(request: Omit<QueuedRequest, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
    const queuedRequest: QueuedRequest = {
      ...request,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0,
    };

    this.queue.push(queuedRequest);
    await this.persist();
  }

  /**
   * Process queue when online
   */
  static async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const request = this.queue[0];
      if (!request) {
        this.queue.shift();
        continue;
      }

      try {
        await this.executeRequest(request);
        this.queue.shift(); // Remove successful request
      } catch (error) {
        request.retryCount++;

        if (request.retryCount >= this.MAX_RETRIES) {
          console.error('Max retries reached for request:', request);
          this.queue.shift(); // Remove failed request
        } else {
          // Move to end of queue for retry
          this.queue.shift();
          this.queue.push(request);
        }
      }

      await this.persist();
    }

    this.isProcessing = false;
  }

  /**
   * Execute a queued request
   */
  private static async executeRequest(request: QueuedRequest): Promise<void> {
    const response = await fetch(request.url, {
      method: request.method,
      headers: request.headers,
      body: request.body ? JSON.stringify(request.body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }
  }

  /**
   * Persist queue to storage
   */
  private static async persist(): Promise<void> {
    await AsyncStorage.setItem(
      OfflineStorage['QUEUE_KEY'],
      JSON.stringify(this.queue)
    );
  }

  /**
   * Get queue length
   */
  static getQueueLength(): number {
    return this.queue.length;
  }

  /**
   * Clear queue
   */
  static async clearQueue(): Promise<void> {
    this.queue = [];
    await this.persist();
  }
}

/**
 * Network Status Manager
 */
export class NetworkManager {
  private static isOnline = true;
  private static listeners: Array<(isOnline: boolean) => void> = [];

  /**
   * Initialize network monitoring
   */
  static initialize(): void {
    NetInfo.addEventListener((state: any) => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected ?? false;

      // Notify listeners
      this.listeners.forEach(listener => listener(this.isOnline));

      // Process queue when coming back online
      if (!wasOnline && this.isOnline) {
        RequestQueue.processQueue();
      }
    });
  }

  /**
   * Check if online
   */
  static async checkConnection(): Promise<boolean> {
    const state = await NetInfo.fetch();
    this.isOnline = state.isConnected ?? false;
    return this.isOnline;
  }

  /**
   * Get current status
   */
  static getStatus(): boolean {
    return this.isOnline;
  }

  /**
   * Add status change listener
   */
  static addListener(listener: (isOnline: boolean) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
}

/**
 * Offline-First API Client
 */
export class OfflineAPI {
  private static baseURL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

  /**
   * Make an offline-first request
   */
  static async request<T>(
    endpoint: string,
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
      body?: any;
      headers?: Record<string, string>;
      cache?: boolean;
      cacheTTL?: number;
    } = {}
  ): Promise<T> {
    const {
      method = 'GET',
      body,
      headers = {},
      cache = method === 'GET',
      cacheTTL = 3600000, // 1 hour
    } = options;

    const url = `${this.baseURL}${endpoint}`;
    const cacheKey = `${method}:${endpoint}`;

    // For GET requests, try cache first
    if (method === 'GET' && cache) {
      const cached = await OfflineStorage.get<T>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Check if online
    const isOnline = NetworkManager.getStatus();

    if (!isOnline) {
      // If offline and not GET, queue the request
      if (method !== 'GET') {
        await RequestQueue.enqueue({
          url,
          method,
          body,
          headers,
        });
        
        throw new Error('Request queued for when online');
      }

      // If offline GET, return cached data or throw
      const cached = await OfflineStorage.get<T>(cacheKey);
      if (cached) {
        return cached;
      }

      throw new Error('No cached data available offline');
    }

    // Make the request
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      const data: T = await response.json();

      // Cache GET responses
      if (method === 'GET' && cache) {
        await OfflineStorage.save(cacheKey, data, cacheTTL);
      }

      return data;
    } catch (error) {
      // If request fails and we have cached data, return it
      if (method === 'GET' && cache) {
        const cached = await OfflineStorage.get<T>(cacheKey);
        if (cached) {
          return cached;
        }
      }

      throw error;
    }
  }

  /**
   * Convenience methods
   */
  static get<T>(endpoint: string, options?: Omit<Parameters<typeof OfflineAPI.request>[1], 'method'>): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  static post<T>(endpoint: string, body: any, options?: Omit<Parameters<typeof OfflineAPI.request>[1], 'method' | 'body'>): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body });
  }

  static put<T>(endpoint: string, body: any, options?: Omit<Parameters<typeof OfflineAPI.request>[1], 'method' | 'body'>): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body });
  }

  static delete<T>(endpoint: string, options?: Omit<Parameters<typeof OfflineAPI.request>[1], 'method'>): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

/**
 * Sync Manager for periodic background sync
 */
export class SyncManager {
  private static syncInterval: ReturnType<typeof setInterval> | null = null;
  private static readonly SYNC_INTERVAL = 60000; // 1 minute

  /**
   * Start periodic sync
   */
  static startPeriodicSync(): void {
    if (this.syncInterval) return;

    this.syncInterval = setInterval(async () => {
      const isOnline = NetworkManager.getStatus();
      if (isOnline) {
        await RequestQueue.processQueue();
      }
    }, this.SYNC_INTERVAL);
  }

  /**
   * Stop periodic sync
   */
  static stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Force sync now
   */
  static async syncNow(): Promise<void> {
    const isOnline = await NetworkManager.checkConnection();
    if (isOnline) {
      await RequestQueue.processQueue();
    }
  }
}

/**
 * Initialize offline-first system
 */
export const initializeOfflineFirst = async (): Promise<void> => {
  await RequestQueue.initialize();
  NetworkManager.initialize();
  SyncManager.startPeriodicSync();
};

/**
 * Export all utilities
 */
export default {
  OfflineStorage,
  RequestQueue,
  NetworkManager,
  OfflineAPI,
  SyncManager,
  initializeOfflineFirst,
};

// Made with Bob
