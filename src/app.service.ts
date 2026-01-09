import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import packageJson from '../package.json';

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

/**
 * Response structure for the version endpoint.
 */
export interface VersionResponse {
  /** Application name */
  name: string;
  /** Application version from package.json */
  version: string;
  /** Node.js version */
  nodeVersion: string;
  /** Environment (development, production, test) */
  environment: string;
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

  /**
   * Get application version and environment information.
   * @returns Version metadata including app version, Node version, and environment.
   */
  getVersion(): VersionResponse {
    return {
      name: packageJson.name,
      version: packageJson.version,
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'development',
    };
  }
}
