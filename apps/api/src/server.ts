import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import dbPlugin from './plugins/db';
import authPlugin from './plugins/auth';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import cardRoutes from './routes/cards';
import adminRoutes from './routes/admin';

export async function buildApp(opts = {}) {
  const app = Fastify(opts);

  // Plugins
  await app.register(cors, { origin: true });
  await app.register(dbPlugin);
  await app.register(authPlugin);

  // Routes
  await app.register(authRoutes);
  await app.register(userRoutes);
  await app.register(cardRoutes);
  await app.register(adminRoutes);

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
    } catch (err) {
      app.log.error(err);
      process.exit(1);
    }
  };

  start();
}
