import { Redis } from '@upstash/redis';

/**
 * Upstash Redis REST client — dùng cho Cache Service.
 * Kết nối qua REST API (không cần TCP socket).
 * Env vars: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
 */
export const redisClient = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});