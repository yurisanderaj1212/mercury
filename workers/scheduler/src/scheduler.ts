import { PrismaClient } from '@prisma/client';
import { expireOldPublications } from './tasks/expire-publications.task';

const prisma = new PrismaClient();

/**
 * Simple cron runner for Mercury workers.
 * In production this is called by Render Cron Jobs or similar.
 *
 * Schedule:
 *   - Every 24 hours: expire old publications
 */
async function run(): Promise<void> {
  const task = process.env.TASK ?? 'expire-publications';
  console.log(`[scheduler] Running task: ${task}`);

  try {
    if (task === 'expire-publications') {
      const result = await expireOldPublications(prisma);
      console.log(`[scheduler] Expired ${result.expired} publications`);
    } else {
      console.warn(`[scheduler] Unknown task: ${task}`);
    }
  } catch (error) {
    console.error('[scheduler] Task failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

void run();
