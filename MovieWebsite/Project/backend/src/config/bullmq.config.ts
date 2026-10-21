import Redis from 'ioredis';

/**
 * BullMQ Redis connection — dùng TCP (ioredis) cho queue/job.
 * Kết nối qua REDIS_URL (rediss:// protocol cho Upstash TLS).
 * Chỉ dùng cho BullMQ, KHÔNG dùng cho Cache Service.
 */
let connection: Redis | null = null;

if (process.env.REDIS_URL) {
  connection = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null, // BullMQ yêu cầu null
    enableReadyCheck: false,
    family: 4, // Ép buộc sử dụng IPv4 để tránh timeout khi phân giải IPv6
    connectTimeout: 10000, // Timeout 10s tránh treo ứng dụng lâu
    keepAlive: 30000, // Giữ kết nối TCP với Upstash không bị đóng do idle
    retryStrategy(times) {
      return Math.min(times * 500, 2000);
    },
  });

  connection.on('connect', () => {
    console.log('✅ BullMQ Redis connected');
  });

  connection.on('error', (err) => {
    console.error('❌ BullMQ Redis error:', err.message);
  });
}

export const bullmqConnection = connection;
