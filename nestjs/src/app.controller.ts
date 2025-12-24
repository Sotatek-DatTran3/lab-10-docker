import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get('health')
  getHealth() {
    return this.appService.getHealth();
  }

  @Get('api/postgres/test')
  testPostgres() {
    return this.appService.testPostgres();
  }

  @Get('api/redis/test')
  testRedis() {
    return this.appService.testRedis();
  }
}