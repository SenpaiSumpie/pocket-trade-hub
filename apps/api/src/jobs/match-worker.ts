import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { recomputeMatchesForUser } from '../services/match.service';
import type { Server } from 'socket.io';

const QUEUE_NAME = 'match-recompute';

let matchQueue: Queue | null = null;
let matchWorker: Worker | null = null;

function getConnection() {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  return new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
  });
}

function getOrCreateQueue(): Queue {
  if (!matchQueue) {
    matchQueue = new Queue(QUEUE_NAME, {
      connection: getConnection(),
    });
  }
  return matchQueue;
}

/**
 * Queue a debounced match recomputation for a user.
 * Uses job deduplication with a 30-second delay window.
 */
export async function queueMatchRecompute(userId: string): Promise<void> {
  const queue = getOrCreateQueue();
  const jobId = `match:${userId}`;

  // Remove existing job for this user if pending (debounce)
  const existingJob = await queue.getJob(jobId);
  if (existingJob) {
    const state = await existingJob.getState();
    if (state === 'delayed' || state === 'waiting') {
      await existingJob.remove();
    }
  }

  await queue.add(
    'recompute',
    { userId },
    {
      jobId,
      delay: 30000, // 30 seconds debounce
    }
  );
}

/**
 * Initialize the match worker. Call from server.ts startup.
 */
export function initMatchWorker(db: any, io: Server): Worker {
  const connection = getConnection();

  matchWorker = new Worker(
    QUEUE_NAME,
    async (job) => {
      const { userId } = job.data;
      await recomputeMatchesForUser(db, io, userId);
    },
    { connection }
  );

  matchWorker.on('failed', (job, err) => {
    console.error(`Match recompute failed for job ${job?.id}:`, err);
  });

  return matchWorker;
}

/**
 * Graceful shutdown - close queue and worker.
 */
export async function closeMatchWorker(): Promise<void> {
  if (matchWorker) {
    await matchWorker.close();
    matchWorker = null;
  }
  if (matchQueue) {
    await matchQueue.close();
    matchQueue = null;
  }
}

export { matchQueue };
