import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { computeSuggestions } from '../services/suggest.service';

const QUEUE_NAME = 'suggest-compute';

let suggestQueue: Queue | null = null;
let suggestWorker: Worker | null = null;

function getConnection() {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  return new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
  });
}

/**
 * Add a suggestion computation job for a user (on-demand from route).
 */
export async function addSuggestJob(userId: string): Promise<void> {
  if (!suggestQueue) {
    throw new Error('Suggest worker not initialized');
  }
  await suggestQueue.add('compute', { userId }, { jobId: `suggest:${userId}` });
}

/**
 * Initialize the suggest worker. Processes on-demand suggestion computation.
 */
export function initSuggestWorker(db: any, redis: IORedis): Worker {
  const connection = getConnection();

  suggestQueue = new Queue(QUEUE_NAME, { connection: getConnection() });

  suggestWorker = new Worker(
    QUEUE_NAME,
    async (job) => {
      const { userId } = job.data;
      await computeSuggestions(db, redis, userId);
    },
    { connection, limiter: { max: 10, duration: 60000 } },
  );

  suggestWorker.on('failed', (job, err) => {
    console.error(`Suggest compute failed for job ${job?.id}:`, err);
  });

  return suggestWorker;
}

/**
 * Graceful shutdown - close queue and worker.
 */
export async function closeSuggestWorker(): Promise<void> {
  if (suggestWorker) {
    await suggestWorker.close();
    suggestWorker = null;
  }
  if (suggestQueue) {
    await suggestQueue.close();
    suggestQueue = null;
  }
}
