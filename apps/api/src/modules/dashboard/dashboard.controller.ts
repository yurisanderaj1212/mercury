import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AccountStatusGuard } from '../../common/guards/account-status.guard';
import { CurrentUser, UserPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard, AccountStatusGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({ summary: 'Get dashboard summary — favorites, alerts, opportunities' })
  getDashboard(@CurrentUser() user: UserPayload) {
    return this.dashboardService.getDashboard(user.id);
  }

  @Get('activity')
  @ApiOperation({ summary: 'Get recent market activity for favorited products' })
  getActivity(@CurrentUser() user: UserPayload) {
    return this.dashboardService.getActivity(user.id);
  }
}
