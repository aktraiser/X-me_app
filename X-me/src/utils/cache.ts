import Redis from 'ioredis';
import { getRedisUrl } from '../config';
import logger from './logger';

// Cache en mémoire pour les opérations rapides
class MemoryCache {
  private cache: Map<string, { value: any; expires: number }>;
  private maxItems: number;

  constructor(maxItems = 1000) {
    this.cache = new Map();
    this.maxItems = maxItems;
  }

  set(key: string, value: any, ttl = 300): void {
    // Si le cache est plein, supprimer l'élément le plus ancien
    if (this.cache.size >= this.maxItems) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    const expires = Date.now() + ttl * 1000;
    this.cache.set(key, { value, expires });
  }

  get(key: string): any {
    const item = this.cache.get(key);
    if (!item) return null;

    // Supprimer si expiré
    if (item.expires < Date.now()) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;
    if (item.expires < Date.now()) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (item.expires < now) {
        this.cache.delete(key);
      }
    }
  }

  size(): number {
    return this.cache.size;
  }
}

// Cache Redis pour le partage entre instances
class RedisCache {
  private redis: Redis;
  private prefix: string;
  private connected: boolean = false;

  constructor(prefix = 'cache:') {
    this.prefix = prefix;
    const redisUrl = getRedisUrl();
    
    try {
      this.redis = new Redis(redisUrl);
      this.redis.on('connect', () => {
        this.connected = true;
        logger.info('RedisCache connected');
      });
      this.redis.on('error', (err) => {
        this.connected = false;
        logger.error(`RedisCache connection error: ${err.message}`);
      });
    } catch (error) {
      logger.error(`Failed to initialize RedisCache: ${error.message}`);
      // Créer un client fictif pour éviter les erreurs
      this.redis = {
        set: () => Promise.resolve('OK'),
        get: () => Promise.resolve(null),
        del: () => Promise.resolve(0),
        flushdb: () => Promise.resolve('OK'),
      } as unknown as Redis;
    }
  }

  async set(key: string, value: any, ttl = 300): Promise<void> {
    if (!this.connected) return;
    const serializedValue = JSON.stringify(value);
    try {
      await this.redis.set(`${this.prefix}${key}`, serializedValue, 'EX', ttl);
    } catch (error) {
      logger.error(`RedisCache set error for key ${key}: ${error.message}`);
    }
  }

  async get(key: string): Promise<any> {
    if (!this.connected) return null;
    try {
      const value = await this.redis.get(`${this.prefix}${key}`);
      if (!value) return null;
      return JSON.parse(value);
    } catch (error) {
      logger.error(`RedisCache get error for key ${key}: ${error.message}`);
      return null;
    }
  }

  async has(key: string): Promise<boolean> {
    if (!this.connected) return false;
    try {
      const exists = await this.redis.exists(`${this.prefix}${key}`);
      return exists === 1;
    } catch (error) {
      logger.error(`RedisCache has error for key ${key}: ${error.message}`);
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    if (!this.connected) return false;
    try {
      const deleted = await this.redis.del(`${this.prefix}${key}`);
      return deleted === 1;
    } catch (error) {
      logger.error(`RedisCache delete error for key ${key}: ${error.message}`);
      return false;
    }
  }

  async clear(): Promise<void> {
    if (!this.connected) return;
    try {
      // Supprimer uniquement les clés avec notre préfixe
      const keys = await this.redis.keys(`${this.prefix}*`);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      logger.error(`RedisCache clear error: ${error.message}`);
    }
  }
}

// Cache hiérarchique avec mémoire et Redis
class HybridCache {
  private memoryCache: MemoryCache;
  private redisCache: RedisCache;
  private redisEnabled: boolean;

  constructor(redisEnabled = true, maxMemoryItems = 1000) {
    this.memoryCache = new MemoryCache(maxMemoryItems);
    this.redisCache = new RedisCache();
    this.redisEnabled = redisEnabled;
  }

  async set(key: string, value: any, ttl = 300): Promise<void> {
    // Toujours mettre en cache en mémoire
    this.memoryCache.set(key, value, ttl);
    
    // Mettre en cache dans Redis si activé
    if (this.redisEnabled) {
      await this.redisCache.set(key, value, ttl);
    }
  }

  async get(key: string): Promise<any> {
    // Vérifier d'abord le cache en mémoire (plus rapide)
    const memValue = this.memoryCache.get(key);
    if (memValue !== null) {
      return memValue;
    }
    
    // Si pas en mémoire et Redis activé, vérifier Redis
    if (this.redisEnabled) {
      const redisValue = await this.redisCache.get(key);
      if (redisValue !== null) {
        // Mettre en cache en mémoire également
        this.memoryCache.set(key, redisValue);
        return redisValue;
      }
    }
    
    return null;
  }

  async has(key: string): Promise<boolean> {
    // Vérifier d'abord le cache en mémoire
    if (this.memoryCache.has(key)) {
      return true;
    }
    
    // Si pas en mémoire et Redis activé, vérifier Redis
    if (this.redisEnabled) {
      return await this.redisCache.has(key);
    }
    
    return false;
  }

  async delete(key: string): Promise<boolean> {
    const memResult = this.memoryCache.delete(key);
    
    if (this.redisEnabled) {
      const redisResult = await this.redisCache.delete(key);
      return memResult || redisResult;
    }
    
    return memResult;
  }

  async clear(): Promise<void> {
    this.memoryCache.clear();
    
    if (this.redisEnabled) {
      await this.redisCache.clear();
    }
  }

  cleanup(): void {
    this.memoryCache.cleanup();
  }

  size(): number {
    return this.memoryCache.size();
  }
}

// Créer une instance du cache hybride
const cache = new HybridCache();

// Nettoyer le cache toutes les 5 minutes
setInterval(() => {
  cache.cleanup();
}, 5 * 60 * 1000);

export default cache; 