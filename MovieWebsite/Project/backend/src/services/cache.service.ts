import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { redisClient } from '../config/redis.config';

/**
 * Cache Service — Wrapper cho Upstash Redis REST client.
 * Cung cấp các method: get, set, del, delPattern, invalidateMovie
 *
 * Redis Key Patterns (theo design):
 * - movie:{slug}                    TTL 10 phút
 * - movies:page:{n}:limit:{l}:...   TTL 5 phút
 * - search:{encodedQuery}           TTL 2 phút
 * - nguonc:raw:{slug}               TTL 15 phút
 * - watchlist:{userId}              TTL 2 phút
 * - history:{userId}                TTL 1 phút
 */
@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly redis = redisClient;

  /**
   * Lấy giá trị từ cache theo key.
   */
  async get<T = unknown>(key: string): Promise<T | null> {
    try {
      const data = await this.redis.get(key);
      if (!data) return null;
      return typeof data === 'string' ? (JSON.parse(data) as T) : (data as T);
    } catch (error) {
      console.error(`Cache GET error [${key}]:`, error);
      return null;
    }
  }

  /**
   * Lưu giá trị vào cache với TTL (seconds).
   */
  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      await this.redis.setex(key, ttlSeconds, serialized);
    } catch (error) {
      console.error(`Cache SET error [${key}]:`, error);
    }
  }

  /**
   * Xóa một key cụ thể.
   */
  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      console.error(`Cache DEL error [${key}]:`, error);
    }
  }

  /**
   * Xóa tất cả keys matching pattern.
   * Dùng SCAN cursor-based của @upstash/redis để tránh block Redis.
   */
  async delPattern(pattern: string): Promise<void> {
    try {
      const keys: string[] = [];
      let cursor: string | number = 0;
      do {
        const [nextCursor, foundKeys] = await this.redis.scan(
          cursor,
          { match: pattern, count: 100 },
        );
        cursor = nextCursor;
        keys.push(...foundKeys);
      } while (cursor !== 0);

      if (keys.length > 0) {
        // Xóa theo batch vì @upstash/redis del() giới hạn số args
        const batchSize = 20;
        for (let i = 0; i < keys.length; i += batchSize) {
          const batch = keys.slice(i, i + batchSize);
          await this.redis.del(...batch);
        }
      }
    } catch (error) {
      console.error(`Cache DEL_PATTERN error [${pattern}]:`, error);
    }
  }

  /**
   * Invalidate tất cả cache liên quan đến một phim.
   * Xóa: movie:{slug} và tất cả keys có prefix movies:*
   */
  async invalidateMovie(slug: string): Promise<void> {
    await this.del(`movie:${slug}`);
    await this.delPattern('movies:*');
  }

  /**
   * Test kết nối Redis — dùng để verify khi khởi động.
   */
  async ping(): Promise<boolean> {
    try {
      await this.redis.set('ping', 'pong');
      const result = await this.redis.get('ping');
      return result === 'pong';
    } catch (error) {
      console.error('Redis PING failed:', error);
      return false;
    }
  }

  onModuleDestroy() {
    // Upstash REST client không cần disconnect
  }
}