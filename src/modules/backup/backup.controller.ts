import { Controller, Get, Res, StreamableFile } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiProduces } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { BackupService } from './backup.service';

@ApiTags('Backup')
@Controller('backup')
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  /**
   * Export complete database as SQL dump.
   * Rate limited to 3 requests per 5 minutes.
   * @param res - Express response for setting headers
   * @returns SQL dump file as StreamableFile
   */
  @Get('export')
  @Throttle({ default: { limit: 3, ttl: 300000 } }) // 3 requests per 5 minutes
  @ApiOperation({
    summary: 'Export database backup',
    description:
      'Generates a complete SQL dump of the database. Can be restored using psql. Rate limited to 3 requests per 5 minutes.',
  })
  @ApiProduces('application/sql')
  @ApiResponse({
    status: 200,
    description: 'SQL dump file generated successfully',
    content: {
      'application/sql': {
        schema: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests - rate limit exceeded',
  })
  @ApiResponse({
    status: 500,
    description: 'Failed to export database',
  })
  async exportDatabase(@Res({ passthrough: true }) res: Response): Promise<StreamableFile> {
    const sqlBuffer = await this.backupService.generateDatabaseExport();

    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const filename = `easytax-au-backup-${timestamp}.sql`;

    res.set({
      'Content-Type': 'application/sql',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': sqlBuffer.length,
    });

    return new StreamableFile(sqlBuffer);
  }
}
