import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { archiveOldNotifications } from '../services/notification.service';

const QUEUE_NAME = 'notification-archive';

let archiveQueue: Queue | null = null;
let archiveWorker: Worker | null = null;

function getConnection() {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  return new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
  });
}

/**
 * Initialize the notification archive worker and schedule repeatable job.
 * Runs daily at 3am to delete notifications older than 30 days.
 */
export async function initNotificationArchiveWorker(db: any): Promise<void> {
  const connection = getConnection();

  archiveQueue = new Queue(QUEUE_NAME, { connection });

  // Add repeatable job (daily at 3am) with jobId-based deduplication
  await archiveQueue.upsertJobScheduler(
    'archive-old-notifications',
    { pattern: '0 3 * * *' },
    { name: 'archive', data: {} },
  );

  archiveWorker = new Worker(
    QUEUE_NAME,
    async () => {
      const deletedCount = await archiveOldNotifications(db);
      console.log(`[notification-archive] Deleted ${deletedCount} old notifications`);
    },
    { connection: getConnection() },
  );

  archiveWorker.on('failed', (job, err) => {
    console.error(`Notification archive failed for job ${job?.id}:`, err);
  });
}

/**
 * Graceful shutdown.
 */
export async function closeNotificationArchiveWorker(): Promise<void> {
  if (archiveWorker) {
    await archiveWorker.close();
    archiveWorker = null;
  }
  if (archiveQueue) {
    await archiveQueue.close();
    archiveQueue = null;
  }
}
