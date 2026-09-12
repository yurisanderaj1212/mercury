import { Controller, Get, Patch, Post, Param, Body, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, UserPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ─── Users ────────────────────────────────────────────────────────────────

  @Get('users')
  @ApiOperation({ summary: 'List all users (Admin only)' })
  listUsers(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.adminService.listUsers(page, limit);
  }

  @Patch('users/:id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Suspend or activate user (Admin only)' })
  setUserStatus(
    @Param('id') id: string,
    @Body('status') status: 'ACTIVE' | 'SUSPENDED',
    @CurrentUser() admin: UserPayload,
  ) {
    return this.adminService.setUserStatus(admin.id, id, status);
  }

  // ─── Publications ─────────────────────────────────────────────────────────

  @Get('publications')
  @ApiOperation({ summary: 'List all publications including inactive (Admin only)' })
  listPublications(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.adminService.listPublications(page, limit);
  }

  @Patch('publications/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update publication + log (Admin only)' })
  updatePublication(
    @Param('id') id: string,
    @Body() body: { title?: string; description?: string; status?: string },
    @CurrentUser() admin: UserPayload,
  ) {
    return this.adminService.updatePublication(admin.id, id, body);
  }

  // ─── Logs ─────────────────────────────────────────────────────────────────

  @Get('logs')
  @ApiOperation({ summary: 'Get audit logs (Admin only)' })
  @ApiQuery({ name: 'entity', required: false })
  getLogs(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('entity') entity?: string,
  ) {
    return this.adminService.getLogs(page, limit, entity);
  }

  // ─── CSV Import ────────────────────────────────────────────────────────────

  @Post('import/csv')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Import publications from CSV (Admin only)' })
  importCsv(
    @Body() body: { csvContent: string; productId: string; sourceId: string },
  ) {
    // Returns the count of rows parsed — actual processing done by pipeline worker
    const { CsvConnector } = require('../../../../../../workers/collectors/src/connectors/csv.connector');
    const connector = new CsvConnector();
    const rows = connector.parseCSV(body.csvContent);
    return { parsed: rows.length, rows };
  }
}
