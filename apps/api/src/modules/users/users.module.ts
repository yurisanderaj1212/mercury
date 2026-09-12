import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { NotificationPreferencesService } from './notification-preferences.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, UsersRepository, NotificationPreferencesService],
  exports: [UsersService, UsersRepository, NotificationPreferencesService],
})
export class UsersModule {}
