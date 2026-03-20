import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import dbPlugin from './plugins/db';
import authPlugin from './plugins/auth';
import redisPlugin from './plugins/redis';
import socketPlugin from './plugins/socket';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import cardRoutes from './routes/cards';
import adminRoutes from './routes/admin';
import notificationRoutes from './routes/notifications';
import collectionRoutes from './routes/collection';
import wantedRoutes from './routes/wanted';
import matchRoutes from './routes/matches';
import proposalRoutes from './routes/proposals';
import premiumRoutes from './routes/premium';
import postRoutes from './routes/posts';
import oauthRoutes from './routes/oauth';
import promoRoutes from './routes/promo';
import suggestionRoutes from './routes/suggestions';
import metaRoutes from './routes/meta';
import tierlistRoutes from './routes/tierlists';
import { initAnalyticsWorker, closeAnalyticsWorker } from './jobs/analytics-worker';
import { initSuggestWorker, closeSuggestWorker } from './jobs/suggest-worker';
import { initMetaScrapeWorker, closeMetaScrapeWorker } from './jobs/meta-scrape-worker';
import { initCardAlertWorker, closeCardAlertWorker } from './jobs/card-alert-worker';
import { initPostMatchWorker, closePostMatchWorker } from './jobs/post-match-worker';
import { initServerI18n } from './i18n';

export async function buildApp(opts = {}) {
  // Initialize i18n before routes are registered
  await initServerI18n();

  const app = Fastify(opts);

  // Plugins
  await app.register(cors, { origin: true });
  await app.register(dbPlugin);
  await app.register(authPlugin);
  await app.register(redisPlugin);
  await app.register(socketPlugin);

  // Routes
  await app.register(authRoutes);
  await app.register(userRoutes);
  await app.register(cardRoutes);
  await app.register(adminRoutes);
  await app.register(notificationRoutes);
  await app.register(collectionRoutes);
  await app.register(wantedRoutes);
  await app.register(matchRoutes);
  await app.register(proposalRoutes);
  await app.register(premiumRoutes);
  await app.register(postRoutes);
  await app.register(oauthRoutes);
  await app.register(promoRoutes);
  await app.register(suggestionRoutes);
  await app.register(metaRoutes);
  await app.register(tierlistRoutes);

  // Health check
  app.get('/health', async () => ({ status: 'ok' }));

  return app;
}

// Start server if run directly
if (require.main === module) {
  const start = async () => {
    const app = await buildApp({ logger: true });
    const port = parseInt(process.env.PORT || '3000', 10);
    const host = process.env.HOST || '0.0.0.0';

    try {
      await app.listen({ port, host });

      // Initialize background workers
      initAnalyticsWorker(app.db);
      initCardAlertWorker(app.db);
      initPostMatchWorker(app.db, (app as any).io);
      initSuggestWorker(app.db, app.redis);
      initMetaScrapeWorker(app.db);

      // Graceful shutdown
      const shutdown = async () => {
        await closeAnalyticsWorker();
        await closeCardAlertWorker();
        await closePostMatchWorker();
        await closeSuggestWorker();
        await closeMetaScrapeWorker();
        await app.close();
        process.exit(0);
      };

      process.on('SIGTERM', shutdown);
      process.on('SIGINT', shutdown);
    } catch (err) {
      app.log.error(err);
      process.exit(1);
    }
  };

  start();
}
