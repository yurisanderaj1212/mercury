import { Controller, Get, Patch, Delete, Param, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { NotificationPreferencesService } from './notification-preferences.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserProfileDto } from './dto/user-profile.dto';
import { UpdateNotificationPreferencesDto, NotificationPreferencesResponseDto } from './dto/notification-preferences.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AccountStatusGuard } from '../../common/guards/account-status.guard';
import { CurrentUser, UserPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, AccountStatusGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly notifPrefsService: NotificationPreferencesService,
  ) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ status: 200, type: UserProfileDto })
  getProfile(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
  ): Promise<UserProfileDto> {
    return this.usersService.getProfile(user.id, id, user.role);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user profile (fullName and locationId only)' })
  @ApiResponse({ status: 200, type: UserProfileDto })
  updateProfile(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: UserPayload,
  ): Promise<UserProfileDto> {
    return this.usersService.updateProfile(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete user account' })
  deleteAccount(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
  ): Promise<void> {
    return this.usersService.softDelete(user.id, id, user.role);
  }

  @Get(':id/notification-preferences')
  @ApiOperation({ summary: 'Get notification preferences' })
  @ApiResponse({ status: 200, type: NotificationPreferencesResponseDto })
  getNotifPrefs(@Param('id') id: string): Promise<NotificationPreferencesResponseDto> {
    return this.notifPrefsService.get(id);
  }

  @Patch(':id/notification-preferences')
  @ApiOperation({ summary: 'Update notification preferences' })
  @ApiResponse({ status: 200, type: NotificationPreferencesResponseDto })
  updateNotifPrefs(
    @Param('id') id: string,
    @Body() dto: UpdateNotificationPreferencesDto,
  ): Promise<NotificationPreferencesResponseDto> {
    return this.notifPrefsService.update(id, dto);
  }
}
