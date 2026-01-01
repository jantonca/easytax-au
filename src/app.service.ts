import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

/**
 * Response structure for the health endpoint.
 */
export interface HealthResponse {
  /** Overall health status */
  status: 'ok' | 'error';
  /** Database connection status */
  database: 'connected' | 'disconnected';
  /** ISO timestamp of the health check */
  timestamp: string;
}

@Injectable()
export class AppService {
  constructor(private readonly dataSource: DataSource) {}

  getHello(): string {
    return 'Hello World!';
  }

  /**
   * Check the health of the application and its dependencies.
   * @returns Health status including database connection state.
   */
  getHealth(): HealthResponse {
    const isDbConnected = this.dataSource.isInitialized;

    return {
      status: isDbConnected ? 'ok' : 'error',
      database: isDbConnected ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    };
  }
}
