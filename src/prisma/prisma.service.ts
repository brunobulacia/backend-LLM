import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private prismaClient: PrismaClient;
  private connectionPool: Pool;

  constructor() {
    try {
      // Create PostgreSQL connection pool
      this.connectionPool = new Pool({
        connectionString: process.env.DATABASE_URL,
      });

      // Create Prisma adapter
      const adapter = new PrismaPg(this.connectionPool);

      // Create Prisma client with adapter
      this.prismaClient = new PrismaClient({
        adapter,
        log: ['error', 'warn'],
        errorFormat: 'minimal',
      });
    } catch (error) {
      this.logger.error('Error creating Prisma Client:', error);
      throw error;
    }
  }

  async onModuleInit() {
    try {
      await this.prismaClient.$connect();
      this.logger.log('Successfully connected to database');
    } catch (error) {
      this.logger.error('Failed to connect to database', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.prismaClient.$disconnect();
    await this.connectionPool.end();
    this.logger.log('Database connection closed');
  }

  // Proxy all Prisma methods
  get chat() {
    return this.prismaClient.chat;
  }
  get mensaje() {
    return this.prismaClient.mensaje;
  }
  get publicacion() {
    return this.prismaClient.publicacion;
  }
  get $transaction() {
    return this.prismaClient.$transaction.bind(this.prismaClient);
  }
  get $queryRaw() {
    return this.prismaClient.$queryRaw.bind(this.prismaClient);
  }
  get $executeRaw() {
    return this.prismaClient.$executeRaw.bind(this.prismaClient);
  }
}
