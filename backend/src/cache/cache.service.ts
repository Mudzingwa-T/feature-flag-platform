import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

/**
 * Thin cache abstraction over Redis.
 *
 * Design notes:
 *  - The evaluation hot-path reads a flag's resolved config from here, so a cache
 *    hit avoids a Postgres round-trip entirely.
 *  - If Redis is unavailable the service degrades gracefully: get() returns null
 *    (forcing a DB read) and set() becomes a no-op. The API keeps working, just
 *    without the cache. In production you would alert on this, not silently ignore it.
 *  - Invalidation is explicit and key-scoped: any write to a flag deletes that
 *    flag's cache key (see FlagsService). This is a "delete on write" strategy,
 *    which is simple and correct for a low-write / high-read config store.
 */
@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private client: Redis | null = null;
  private healthy = false;

  constructor() {
    const url = process.env.REDIS_URL;
    if (!url) {
      this.logger.warn('REDIS_URL not set — cache disabled, evaluation will read from DB every time.');
      return;
    }
    this.client = new Redis(url, {
      lazyConnect: false,
      maxRetriesPerRequest: 1,
      retryStrategy: (times) => (times > 5 ? null : Math.min(times * 200, 1000)),
    });
    this.client.on('ready', () => {
      this.healthy = true;
      this.logger.log('Redis connected');
    });
    this.client.on('error', (err) => {
      this.healthy = false;
      this.logger.warn(`Redis error (cache will be bypassed): ${err.message}`);
    });
  }

  static flagKey(environmentKey: string, flagKey: string): string {
    return `flag:${environmentKey}:${flagKey}`;
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.client || !this.healthy) return null;
    try {
      const raw = await this.client.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
    if (!this.client || !this.healthy) return;
    try {
      await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch {
      /* ignore cache write failures */
    }
  }

  async del(key: string): Promise<void> {
    if (!this.client || !this.healthy) return;
    try {
      await this.client.del(key);
    } catch {
      /* ignore */
    }
  }

  async onModuleDestroy() {
    if (this.client) await this.client.quit().catch(() => undefined);
  }
}
