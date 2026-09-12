import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AlertsService } from './alerts.service';
import { CreateAlertDto, AlertResponseDto } from './dto/alert.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AccountStatusGuard } from '../../common/guards/account-status.guard';
import { CurrentUser, UserPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('alerts')
@Controller('alerts')
@UseGuards(JwtAuthGuard, AccountStatusGuard)
@ApiBearerAuth()
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  @ApiOperation({ summary: 'List user alerts' })
  list(@CurrentUser() user: UserPayload): Promise<AlertResponseDto[]> {
    return this.alertsService.list(user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create alert (max 20 active for PERSONAL)' })
  create(@CurrentUser() user: UserPayload, @Body() dto: CreateAlertDto): Promise<AlertResponseDto> {
    return this.alertsService.create(user.id, user.role, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Pause or reactivate alert' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
    @Body('status') status: 'ACTIVE' | 'PAUSED',
  ): Promise<AlertResponseDto> {
    return this.alertsService.update(user.id, id, { status });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete alert (history preserved)' })
  delete(@Param('id') id: string, @CurrentUser() user: UserPayload): Promise<void> {
    return this.alertsService.softDelete(user.id, id);
  }
}
