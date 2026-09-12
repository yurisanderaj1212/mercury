import { PrismaClient } from '@prisma/client';

const EXPIRY_DAYS = 30;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Expire publications that haven't been updated in 30 days.
 * Called by the scheduler every 24 hours.
 * Records every expired publication in the logs table.
 */
export async function expireOldPublications(prisma: PrismaClient): Promise<{ expired: number }> {
  const cutoffDate = new Date(Date.now() - EXPIRY_DAYS * MS_PER_DAY);

  // Find all ACTIVE publications not updated in 30+ days
  const stale = await prisma.publication.findMany({
    where: {
      status: 'ACTIVE',
      updatedAt: { lt: cutoffDate },
    },
    select: { id: true },
  });

  if (stale.length === 0) return { expired: 0 };

  const ids = stale.map((p) => p.id);

  // Expire them and log in a single transaction
  await prisma.$transaction(async (tx) => {
    // Bulk expire
    await tx.publication.updateMany({
      where: { id: { in: ids } },
      data: { status: 'EXPIRED' },
    });

    // Log each expiration
    await tx.log.createMany({
      data: ids.map((id) => ({
        action: 'EXPIRE',
        entity: 'publication',
        entityId: id,
        metadata: { reason: `No update in ${EXPIRY_DAYS} days`, cutoffDate },
      })),
    });
  });

  return { expired: stale.length };
}
