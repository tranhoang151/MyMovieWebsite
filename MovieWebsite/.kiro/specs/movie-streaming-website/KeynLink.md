Supabase: 
NEXT_PUBLIC_SUPABASE_URL=https://ztdnhzcxxlhawyoltfaz.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_JKnoAJGvONpCZ0LscuWATQ_2htrokbD
postgresql://postgres:[minhhoangtrandz151]@db.ztdnhzcxxlhawyoltfaz.supabase.co:5432/postgres
# Connect to Postgres via the shared transaction-mode pooler (IPv4-only)
DATABASE_URL="postgresql://postgres.ztdnhzcxxlhawyoltfaz:[minhhoangtrandz151]@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Connect to Postgres via the shared session-mode pooler (used for migrations)
DIRECT_URL="postgresql://postgres.ztdnhzcxxlhawyoltfaz:[minhhoangtrandz151]@aws-1-us-east-2.pooler.supabase.com:5432/postgres"


Redis Upstash:
UPSTASH_REDIS_REST_URL="https://logical-oriole-306843.upstash.io"
UPSTASH_REDIS_REST_TOKEN="gQAAAAAABK6bAAIgcDE3M2FjOWM5ZWU0OTU0MmNmOGZmN2MzMjEwOWZhZTA1Zg"
redis-cli --tls -u redis://default:gQAAAAAABK6bAAIgcDE3M2FjOWM5ZWU0OTU0MmNmOGZmN2MzMjEwOWZhZTA1Zg@logical-oriole-306843.upstash.io:6379

REDIS_URL="rediss://default:gQAAAAAABK6bAAIgcDE3M2FjOWM5ZWU0OTU0MmNmOGZmN2MzMjEwOWZhZTA1Zg@logical-oriole-306843.upstash.io:6379"