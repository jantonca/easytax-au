import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import type { HealthResponse } from './app.service';

@ApiTags('System')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  /**
   * Health check endpoint for monitoring and orchestration tools.
   * @returns Current health status of the application and database.
   */
  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({
    status: 200,
    description: 'Application health status',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['ok', 'error'] },
        database: { type: 'string', enum: ['connected', 'disconnected'] },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  getHealth(): HealthResponse {
    return this.appService.getHealth();
  }
}
