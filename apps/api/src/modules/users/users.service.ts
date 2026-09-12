import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { UsersRepository, UserWithDetails } from './users.repository';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserProfileDto } from './dto/user-profile.dto';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepo: UsersRepository) {}

  async getProfile(requesterId: string, targetId: string, requesterRole: string): Promise<UserProfileDto> {
    // Only own profile or Admin
    if (requesterId !== targetId && requesterRole !== 'ADMIN') {
      throw new ForbiddenException('FORBIDDEN');
    }

    const user = await this.usersRepo.findById(targetId);
    if (!user) throw new NotFoundException('USER_NOT_FOUND');

    return this.toProfile(user);
  }

  async updateProfile(requesterId: string, targetId: string, dto: UpdateUserDto): Promise<UserProfileDto> {
    // Only own profile
    if (requesterId !== targetId) {
      throw new ForbiddenException('FORBIDDEN');
    }

    const user = await this.usersRepo.findById(targetId);
    if (!user) throw new NotFoundException('USER_NOT_FOUND');

    // Only update allowed fields — never email or role
    const updated = await this.usersRepo.update(targetId, {
      fullName: dto.fullName,
      locationId: dto.locationId,
    });

    return this.toProfile(updated);
  }

  async softDelete(requesterId: string, targetId: string, requesterRole: string): Promise<void> {
    // Only own account or Admin
    if (requesterId !== targetId && requesterRole !== 'ADMIN') {
      throw new ForbiddenException('FORBIDDEN');
    }

    const user = await this.usersRepo.findById(targetId);
    if (!user) throw new NotFoundException('USER_NOT_FOUND');

    await this.usersRepo.softDelete(targetId);
  }

  private toProfile(user: UserWithDetails): UserProfileDto {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role.name,
      status: user.status,
      createdAt: user.createdAt,
      municipality: user.location?.municipality,
      province: user.location?.province,
      avatarUrl: user.avatarUrl ?? undefined,
      lastLogin: user.lastLogin ?? undefined,
    };
  }
}
