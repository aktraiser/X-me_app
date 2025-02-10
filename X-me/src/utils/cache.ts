interface CacheItem<T> {
  value: T;
  expiry: number;
}

class Cache {
  private storage: Map<string, CacheItem<any>> = new Map();

  public set<T>(key: string, value: T, ttlSeconds: number): void {
    const expiry = Date.now() + (ttlSeconds * 1000);
    this.storage.set(key, { value, expiry });
  }

  public get<T>(key: string): T | null {
    const item = this.storage.get(key);
    
    if (!item) {
      return null;
    }

    if (Date.now() > item.expiry) {
      this.storage.delete(key);
      return null;
    }

    return item.value as T;
  }

  public clear(): void {
    this.storage.clear();
  }

  public cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.storage.entries()) {
      if (now > item.expiry) {
        this.storage.delete(key);
      }
    }
  }
}

// Nettoyer le cache toutes les 5 minutes
setInterval(() => {
  cache.cleanup();
}, 5 * 60 * 1000);

export const cache = new Cache(); 