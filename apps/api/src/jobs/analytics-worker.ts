import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { computeAllAnalytics } from '../services/analytics.service';

const QUEUE_NAME = 'analytics-compute';

let analyticsQueue: Queue | null = null;
let analyticsWorker: Worker | null = null;

function getConnection() {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  return new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
  });
}

/**
 * Initialize the analytics worker. Runs computeAllAnalytics daily at 4am.
 */
export function initAnalyticsWorker(db: any): Worker {
  const connection = getConnection();

  analyticsQueue = new Queue(QUEUE_NAME, { connection: getConnection() });

  // Schedule daily analytics computation at 4am
  analyticsQueue.upsertJobScheduler(
    'compute-daily-analytics',
    { pattern: '0 4 * * *' },
    { name: 'compute', data: {} },
  );

  analyticsWorker = new Worker(
    QUEUE_NAME,
    async () => {
      await computeAllAnalytics(db);
    },
    { connection },
  );

  analyticsWorker.on('failed', (job, err) => {
    console.error(`Analytics compute failed for job ${job?.id}:`, err);
  });

  return analyticsWorker;
}

/**
 * Graceful shutdown - close queue and worker.
 */
export async function closeAnalyticsWorker(): Promise<void> {
  if (analyticsWorker) {
    await analyticsWorker.close();
    analyticsWorker = null;
  }
  if (analyticsQueue) {
    await analyticsQueue.close();
    analyticsQueue = null;
  }
}
