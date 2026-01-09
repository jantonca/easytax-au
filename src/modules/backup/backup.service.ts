import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Generates a SQL dump of the database.
   * Handles both Docker and bare-metal deployments.
   * @returns SQL dump as Buffer
   */
  async generateDatabaseExport(): Promise<Buffer> {
    const isDocker = this.configService.get<string>('IS_DOCKER') === 'true';
    const dbHost = this.configService.get<string>('DB_HOST', 'localhost');
    const dbPort = this.configService.get<string>('DB_PORT', '5432');
    const dbUser = this.configService.get<string>('DB_USERNAME', 'postgres');
    const dbPassword = this.configService.get<string>('DB_PASSWORD');
    const dbName = this.configService.get<string>('DB_NAME', 'easytax-au');

    this.logger.log(`Starting database export (Docker: ${isDocker})`);

    try {
      let stdout: string;

      if (isDocker) {
        // Docker: Use docker exec to run pg_dump inside the container
        const containerName = 'easytax-au-db';
        const { stdout: output } = await execFileAsync(
          'docker',
          ['exec', containerName, 'pg_dump', '-U', dbUser, '-d', dbName],
          {
            encoding: 'utf-8',
            maxBuffer: 50 * 1024 * 1024, // 50MB max
            timeout: 60000, // 60 second timeout
          },
        );
        stdout = output;
      } else {
        // Bare-metal: Run pg_dump directly
        const env = dbPassword ? { PGPASSWORD: dbPassword } : {};
        const { stdout: output } = await execFileAsync(
          'pg_dump',
          ['-h', dbHost, '-p', dbPort, '-U', dbUser, '-d', dbName],
          {
            encoding: 'utf-8',
            maxBuffer: 50 * 1024 * 1024, // 50MB max
            timeout: 60000, // 60 second timeout
            env: { ...process.env, ...env },
          },
        );
        stdout = output;
      }

      this.logger.log('Database export completed successfully');
      return Buffer.from(stdout, 'utf-8');
    } catch (error) {
      this.logger.error('Failed to generate database export', error);
      throw new InternalServerErrorException(
        'Failed to export database. Please ensure PostgreSQL is running and accessible.',
      );
    }
  }
}
