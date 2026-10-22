import { Redis } from '@upstash/redis';

/**
 * Upstash Redis REST client — dùng cho Cache Service.
 * Kết nối qua REST API (không cần TCP socket).
 * Env vars: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
 */
const rawUrl = process.env.UPSTASH_REDIS_REST_URL || '';
const rawToken = process.env.UPSTASH_REDIS_REST_TOKEN || '';

const url = rawUrl.trim().replace(/^["']|["']$/g, '');
const token = rawToken.trim().replace(/^["']|["']$/g, '');

export const redisClient = new Redis({
  url: url || 'https://placeholder.upstash.io',
  token: token || 'placeholder',
});
