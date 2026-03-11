import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { processCardAlertBatch } from '../services/card-alert.service';

const QUEUE_NAME = 'card-alert-batch';

let cardAlertQueue: Queue | null = null;
let cardAlertWorker: Worker | null = null;

function getConnection() {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  return new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
  });
}

/**
 * Initialize the card alert worker. Runs processCardAlertBatch every 2 hours.
 */
export function initCardAlertWorker(db: any): Worker {
  const connection = getConnection();

  cardAlertQueue = new Queue(QUEUE_NAME, { connection: getConnection() });

  // Schedule card alert batch processing every 2 hours
  cardAlertQueue.upsertJobScheduler(
    'process-card-alerts',
    { pattern: '0 */2 * * *' },
    { name: 'process-batch', data: {} },
  );

  cardAlertWorker = new Worker(
    QUEUE_NAME,
    async () => {
      await processCardAlertBatch(db);
    },
    { connection },
  );

  cardAlertWorker.on('failed', (job, err) => {
    console.error(`Card alert batch failed for job ${job?.id}:`, err);
  });

  return cardAlertWorker;
}

/**
 * Graceful shutdown - close queue and worker.
 */
export async function closeCardAlertWorker(): Promise<void> {
  if (cardAlertWorker) {
    await cardAlertWorker.close();
    cardAlertWorker = null;
  }
  if (cardAlertQueue) {
    await cardAlertQueue.close();
    cardAlertQueue = null;
  }
}
