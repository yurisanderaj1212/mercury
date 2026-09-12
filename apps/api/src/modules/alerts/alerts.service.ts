import { Injectable, UnprocessableEntityException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { AlertsRepository } from './alerts.repository';
import { PrismaService } from '../database/prisma.service';
import { CreateAlertDto, UpdateAlertDto, AlertResponseDto } from './dto/alert.dto';
import { Alert } from '@prisma/client';

const ALERT_LIMIT_PERSONAL = 20;

@Injectable()
export class AlertsService {
  constructor(
    private readonly alertsRepo: AlertsRepository,
    private readonly prisma: PrismaService,
  ) {}

  async create(userId: string, userRole: string, dto: CreateAlertDto): Promise<AlertResponseDto> {
    // Enforce 20 active alerts limit for PERSONAL role
    if (userRole === 'PERSONAL') {
      const activeCount = await this.alertsRepo.countActive(userId);
      if (activeCount >= ALERT_LIMIT_PERSONAL) {
        throw new UnprocessableEntityException('ALERT_LIMIT_REACHED');
      }
    }

    // Create alert in transaction
    const alert = await this.prisma.$transaction(async (tx) => {
      return tx.alert.create({
        data: {
          userId,
          productId: dto.productId,
          maximumPrice: dto.maximumPrice,
          currency: dto.currency,
          alertType: dto.alertType,
          changePercent: dto.changePercent,
          locationId: dto.locationId,
          status: 'ACTIVE',
        },
      });
    });

    return this.toResponse(alert);
  }

  async list(userId: string): Promise<AlertResponseDto[]> {
    const alerts = await this.alertsRepo.findByUser(userId);
    return alerts.map(this.toResponse);
  }

  async update(userId: string, id: string, dto: UpdateAlertDto): Promise<AlertResponseDto> {
    const alert = await this.alertsRepo.findById(id);
    if (!alert) throw new NotFoundException('ALERT_NOT_FOUND');
    if (alert.userId !== userId) throw new ForbiddenException('FORBIDDEN');

    const updated = await this.alertsRepo.update(id, { status: dto.status });
    return this.toResponse(updated);
  }

  async pause(userId: string, id: string): Promise<AlertResponseDto> {
    return this.update(userId, id, { status: 'PAUSED' });
  }

  async reactivate(userId: string, id: string): Promise<AlertResponseDto> {
    return this.update(userId, id, { status: 'ACTIVE' });
  }

  async softDelete(userId: string, id: string): Promise<void> {
    const alert = await this.alertsRepo.findById(id);
    if (!alert) throw new NotFoundException('ALERT_NOT_FOUND');
    if (alert.userId !== userId) throw new ForbiddenException('FORBIDDEN');

    // Soft-delete: preserve historical data
    await this.alertsRepo.update(id, { status: 'DELETED' });
  }

  private toResponse(alert: Alert): AlertResponseDto {
    return {
      id: alert.id,
      userId: alert.userId,
      productId: alert.productId,
      maximumPrice: Number(alert.maximumPrice),
      currency: alert.currency,
      alertType: alert.alertType,
      changePercent: alert.changePercent ? Number(alert.changePercent) : undefined,
      locationId: alert.locationId ?? undefined,
      status: alert.status,
      triggeredAt: alert.triggeredAt ?? undefined,
      triggeredPrice: alert.triggeredPrice ? Number(alert.triggeredPrice) : undefined,
      createdAt: alert.createdAt,
      updatedAt: alert.updatedAt,
    };
  }
}
