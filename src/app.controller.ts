import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import type { HealthResponse, VersionResponse } from './app.service';

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

  /**
   * Version information endpoint for system monitoring and UI display.
   * @returns Application version and environment metadata.
   */
  @Get('version')
  @ApiOperation({ summary: 'Application version information' })
  @ApiResponse({
    status: 200,
    description: 'Application version metadata',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'easytax-au' },
        version: { type: 'string', example: '0.0.1' },
        nodeVersion: { type: 'string', example: 'v22.10.7' },
        environment: {
          type: 'string',
          enum: ['development', 'production', 'test'],
        },
      },
    },
  })
  getVersion(): VersionResponse {
    return this.appService.getVersion();
  }
}
