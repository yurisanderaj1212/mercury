import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { User, Role } from '@prisma/client';

export type UserWithRole = User & { role: Role };

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<UserWithRole | null> {
    return this.prisma.user.findFirst({
      where: { email, deletedAt: null },
      include: { role: true },
    });
  }

  async findById(id: string): Promise<UserWithRole | null> {
    return this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: { role: true },
    });
  }

  async create(data: {
    email: string;
    passwordHash: string;
    fullName: string;
    roleId: string;
  }): Promise<UserWithRole> {
    return this.prisma.user.create({
      data,
      include: { role: true },
    });
  }

  async findPersonalRoleId(): Promise<string> {
    const role = await this.prisma.role.findUniqueOrThrow({
      where: { name: 'PERSONAL' },
    });
    return role.id;
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { lastLogin: new Date() },
    });
  }
}
