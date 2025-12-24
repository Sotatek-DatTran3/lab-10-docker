import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { createClient } from 'redis';

@Injectable()
export class AppService {
  private redisClient: any;
  private redisConnected: boolean = false;

  constructor(@InjectDataSource() private dataSource: DataSource) {
    // Initialize Redis with retry logic (non-blocking)
    this.initializeRedisWithRetry();
  }

  /**
   * Initialize Redis connection with retry logic
   * Retries up to 5 times with exponential backoff
   */
  private async initializeRedisWithRetry() {
    const maxRetries = 5;
    const baseDelay = 2000; // 2 seconds

    // Support both REDIS_URL and REDIS_HOST/REDIS_PORT
    let redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      const redisHost = process.env.REDIS_HOST || 'redis';
      const redisPort = process.env.REDIS_PORT || '6379';
      redisUrl = `redis://${redisHost}:${redisPort}`;
    }
    console.log(`🔗 Redis URL: ${redisUrl}`);

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Attempting Redis connection (attempt ${attempt}/${maxRetries})...`);

        this.redisClient = createClient({
          url: redisUrl,
          socket: {
            reconnectStrategy: (retries) => {
              if (retries > 5) {
                console.error('❌ Redis: Max reconnection attempts reached');
                return new Error('Max reconnection attempts reached');
              }
              const delay = Math.min(retries * 100, 3000);
              console.log(`🔄 Redis: Reconnecting in ${delay}ms (attempt ${retries})`);
              return delay;
            },
            connectTimeout: 10000, // 10 seconds
          },
        });

        // Set up error handlers
        this.redisClient.on('error', (err) => {
          console.error('❌ Redis client error:', err.message);
          this.redisConnected = false;
        });

        this.redisClient.on('connect', () => {
          console.log('🔄 Redis: Connecting...');
        });

        this.redisClient.on('ready', () => {
          console.log('✅ Redis: Ready');
          this.redisConnected = true;
        });

        await this.redisClient.connect();
        console.log('✅ Redis connected successfully');
        this.redisConnected = true;
        return; // Success, exit retry loop
      } catch (error) {
        console.error(`❌ Redis connection attempt ${attempt} failed:`, error.message);

        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
          console.log(`⏳ Waiting ${delay}ms before retry...`);
          await this.sleep(delay);
        } else {
          console.error('❌ Redis: All connection attempts failed. Will retry in background.');
          // Continue retrying in background
          this.retryRedisConnection(redisUrl);
        }
      }
    }
  }

  /**
   * Background retry for Redis connection
   */
  private async retryRedisConnection(redisUrl: string) {
    const retryInterval = 10000; // Retry every 10 seconds

    const retryLoop = async () => {
      while (!this.redisConnected) {
        try {
          await this.sleep(retryInterval);
          console.log('🔄 Retrying Redis connection in background...');

          if (this.redisClient && this.redisClient.isOpen) {
            await this.redisClient.quit();
          }

          this.redisClient = createClient({ url: redisUrl });
          await this.redisClient.connect();

          console.log('✅ Redis connected successfully (background retry)');
          this.redisConnected = true;
          return;
        } catch (error) {
          console.error('❌ Redis background retry failed:', error.message);
        }
      }
    };

    retryLoop(); // Don't await, run in background
  }

  /**
   * Sleep utility for delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getHealth() {
    const health = {
      service: 'NestJS Backend',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      database: await this.getDatabaseStatus(),
      uptime: process.uptime(),
    };

    return health;
  }

  private async getDatabaseStatus() {
    const status = {
      postgresql: 'Disconnected',
      redis: 'Disconnected',
    };

    // Test PostgreSQL with retry
    try {
      await this.testPostgresConnection();
      status.postgresql = 'Connected';
    } catch (error) {
      console.error('PostgreSQL health check failed:', error.message);
    }

    // Test Redis
    try {
      if (this.redisClient && this.redisClient.isOpen) {
        await this.redisClient.ping();
        status.redis = 'Connected';
      } else if (this.redisConnected) {
        status.redis = 'Connecting...';
      }
    } catch (error) {
      console.error('Redis health check failed:', error.message);
    }

    return status;
  }

  /**
   * Test PostgreSQL connection with retry logic
   */
  private async testPostgresConnection(maxRetries: number = 3): Promise<void> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.dataSource.query('SELECT version()');
        return; // Success
      } catch (error) {
        if (attempt === maxRetries) {
          throw error; // Re-throw on final attempt
        }
        const delay = 1000 * attempt; // 1s, 2s, 3s
        console.log(`🔄 PostgreSQL connection retry ${attempt}/${maxRetries} in ${delay}ms...`);
        await this.sleep(delay);
      }
    }
  }

  async testPostgres() {
    try {
      const result = await this.dataSource.query('SELECT version()');
      const userCount = await this.dataSource.query(
        'SELECT COUNT(*) as count FROM users',
      );

      return {
        message: 'PostgreSQL connection successful',
        version: result[0]?.version,
        userCount: parseInt(userCount[0]?.count || '0'),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        {
          error: 'PostgreSQL connection failed',
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async testRedis() {
    try {
      if (!this.redisClient || !this.redisClient.isOpen) {
        throw new Error('Redis client not available');
      }

      const testKey = 'nestjs-test-key';
      const testValue = 'Hello from NestJS!';

      await this.redisClient.set(testKey, testValue, { EX: 300 });
      const retrievedValue = await this.redisClient.get(testKey);

      return {
        message: 'Redis connection successful',
        testValue: retrievedValue,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        {
          error: 'Redis connection failed',
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}