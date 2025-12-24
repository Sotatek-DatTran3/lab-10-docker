import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  // Enable global validation
  app.useGlobalPipes(new ValidationPipe());

  await app.listen(3000, '0.0.0.0');
  console.log('🚀 NestJS server running on port 3000');
  console.log('📍 Health check: http://localhost:3000/health');
}
bootstrap();