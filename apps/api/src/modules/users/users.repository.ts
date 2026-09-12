import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { User, Role, Location } from '@prisma/client';

export type UserWithDetails = User & { role: Role; location: Location | null };

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<UserWithDetails | null> {
    return this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: { role: true, location: true },
    });
  }

  async update(
    id: string,
    data: { fullName?: string; locationId?: string | null },
  ): Promise<UserWithDetails> {
    return this.prisma.user.update({
      where: { id },
      data,
      include: { role: true, location: true },
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
