import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Source, SourceName } from '@prisma/client';

@Injectable()
export class SourcesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Source[]> {
    return this.prisma.source.findMany();
  }

  async findByName(name: SourceName): Promise<Source | null> {
    return this.prisma.source.findUnique({ where: { name } });
  }

  async findByNameOrThrow(name: SourceName): Promise<Source> {
    return this.prisma.source.findUniqueOrThrow({ where: { name } });
  }
}
