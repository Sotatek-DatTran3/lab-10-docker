import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TerminusModule } from '@nestjs/terminus';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { User } from './users/user.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        // Support both DATABASE_URL and individual env vars
        let config: any = {
          type: 'postgres',
          entities: [User],
          synchronize: true, // Don't use in production
          logging: true,
          // Retry configuration for PostgreSQL connection
          retryAttempts: 5, // Number of retry attempts
          retryDelay: 2000, // Delay between retries (ms)
          autoLoadEntities: true,
          // Connection pool settings
          extra: {
            max: 10, // Maximum number of connections in pool
            min: 2,  // Minimum number of connections in pool
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 10000, // 10 seconds timeout
          },
        };

        // Parse DATABASE_URL if provided (format: postgresql://user:password@host:port/database)
        const databaseUrl = process.env.DATABASE_URL;
        if (databaseUrl) {
          try {
            const url = new URL(databaseUrl);
            config.host = url.hostname;
            config.port = parseInt(url.port) || 5432;
            config.username = url.username || 'postgres';
            config.password = url.password || 'password';
            config.database = url.pathname.slice(1) || 'devdb'; // Remove leading '/'
            console.log(`📊 Using DATABASE_URL for PostgreSQL connection`);
          } catch (error) {
            console.warn('⚠️ Failed to parse DATABASE_URL, using individual env vars');
          }
        }

        // Fallback to individual environment variables
        if (!config.host) {
          config.host = process.env.DB_HOST || 'postgres';
          config.port = parseInt(process.env.DB_PORT) || 5432;
          config.username = process.env.DB_USER || 'postgres';
          config.password = process.env.DB_PASS || 'password';
          config.database = process.env.DB_NAME || 'devdb';
        }

        console.log(`📊 PostgreSQL config: ${config.host}:${config.port}/${config.database}`);
        return config;
      },
    }),
    TerminusModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }