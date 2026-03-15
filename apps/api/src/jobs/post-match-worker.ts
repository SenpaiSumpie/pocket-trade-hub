import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { processPostMatch } from '../services/post-match.service';
import type { Server } from 'socket.io';

const QUEUE_NAME = 'post-match';

let postMatchQueue: Queue | null = null;
let postMatchWorker: Worker | null = null;

function getConnection(): any {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  return new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
  });
}

function getOrCreateQueue(): Queue {
  if (!postMatchQueue) {
    postMatchQueue = new Queue(QUEUE_NAME, {
      connection: getConnection(),
    });
  }
  return postMatchQueue;
}

/**
 * Queue a post-match job with 5-second delay for batching rapid post creation.
 * Uses jobId for deduplication.
 */
export async function queuePostMatch(postId: string, userId: string): Promise<void> {
  const queue = getOrCreateQueue();
  const jobId = `post-match:${postId}`;

  // Remove existing job for this post if pending (debounce)
  const existingJob = await queue.getJob(jobId);
  if (existingJob) {
    const state = await existingJob.getState();
    if (state === 'delayed' || state === 'waiting') {
      await existingJob.remove();
    }
  }

  await queue.add(
    'match-post',
    { postId, userId },
    {
      jobId,
      delay: 5000, // 5-second delay for batching
    },
  );
}

/**
 * Initialize the post-match worker. Call from server.ts startup.
 */
export function initPostMatchWorker(db: any, io: Server): Worker {
  const connection = getConnection();

  postMatchWorker = new Worker(
    QUEUE_NAME,
    async (job) => {
      const { postId } = job.data;
      await processPostMatch(db, io, postId);
    },
    { connection },
  );

  postMatchWorker.on('failed', (job, err) => {
    console.error(`Post match failed for job ${job?.id}:`, err);
  });

  return postMatchWorker;
}

/**
 * Graceful shutdown - close queue and worker.
 */
export async function closePostMatchWorker(): Promise<void> {
  if (postMatchWorker) {
    await postMatchWorker.close();
    postMatchWorker = null;
  }
  if (postMatchQueue) {
    await postMatchQueue.close();
    postMatchQueue = null;
  }
}

export { postMatchQueue };
