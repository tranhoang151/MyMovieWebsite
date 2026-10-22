import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const rawUrl = process.env.DATABASE_URL || '';
    const connectionString = rawUrl.trim().replace(/^["']|["']$/g, '');

    const pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
    });

    pool.on('error', (err) => {
      console.error('Unexpected error on idle PostgreSQL client:', err);
    });

    super({
      adapter: new PrismaPg(pool),
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('✅ Prisma connected to PostgreSQL successfully');
    } catch (err) {
      this.logger.error('❌ Prisma connection error on startup:', err);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
