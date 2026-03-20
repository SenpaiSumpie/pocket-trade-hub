import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { scrapeDeckMeta } from '../services/meta-scraper.service';
import { upsertDeckMeta } from '../services/meta.service';
import { generateOfficialTierList } from '../services/tierlist.service';

const QUEUE_NAME = 'meta-scrape';

let metaScrapeQueue: Queue | null = null;
let metaScrapeWorker: Worker | null = null;

function getConnection() {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  return new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
  });
}

/**
 * Initialize the meta scrape worker. Runs daily at 5am (after analytics at 4am).
 */
export function initMetaScrapeWorker(db: any): Worker {
  const connection = getConnection();

  metaScrapeQueue = new Queue(QUEUE_NAME, { connection: getConnection() });

  // Schedule daily meta scraping at 5am
  metaScrapeQueue.upsertJobScheduler(
    'scrape-daily-meta',
    { pattern: '0 5 * * *' },
    { name: 'scrape', data: {} },
  );

  metaScrapeWorker = new Worker(
    QUEUE_NAME,
    async () => {
      console.log('[meta-scrape] Starting daily meta scrape...');

      const decks = await scrapeDeckMeta();
      console.log(`[meta-scrape] Scraped ${decks.length} decks`);

      await upsertDeckMeta(db, decks);
      console.log('[meta-scrape] Upserted deck meta data');

      await generateOfficialTierList(db);
      console.log('[meta-scrape] Official tier list updated');
    },
    { connection },
  );

  metaScrapeWorker.on('failed', (job, err) => {
    console.error(`[meta-scrape] Failed for job ${job?.id}:`, err);
    // Keep stale data — do NOT delete old data on failure
  });

  return metaScrapeWorker;
}

/**
 * Graceful shutdown - close queue and worker.
 */
export async function closeMetaScrapeWorker(): Promise<void> {
  if (metaScrapeWorker) {
    await metaScrapeWorker.close();
    metaScrapeWorker = null;
  }
  if (metaScrapeQueue) {
    await metaScrapeQueue.close();
    metaScrapeQueue = null;
  }
}
