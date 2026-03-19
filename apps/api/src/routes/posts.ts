import type { FastifyInstance } from 'fastify';
import { createPostSchema } from '@pocket-trade-hub/shared';
import {
  createPost,
  getPosts,
  getMyPosts,
  closePost,
  deletePost,
} from '../services/post.service';
import { queuePostMatch } from '../jobs/post-match-worker';
import { t, parseAcceptLanguage } from '../i18n';

export default async function postRoutes(fastify: FastifyInstance) {
  // POST /posts - create a new trade post
  fastify.post(
    '/posts',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const lang = parseAcceptLanguage(request.headers['accept-language']);
      const parsed = createPostSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({
          error: t('errors.validationFailed', lang),
          details: parsed.error.flatten(),
        });
      }

      const userId = request.user.sub;

      try {
        const post = await createPost(fastify.db, userId, parsed.data);

        // Queue background post matching job
        try {
          await queuePostMatch(post.id, userId);
        } catch {
          // Redis/queue failures are non-critical
        }

        return reply.code(201).send({ post });
      } catch (err: any) {
        const status = err.statusCode || 500;
        // Translate known error messages
        const message = err.message || t('errors.serverError', lang);
        return reply.code(status).send({ error: message });
      }
    },
  );

  // GET /posts/mine - get authenticated user's posts (must be before /posts/:id)
  fastify.get(
    '/posts/mine',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const userId = request.user.sub;
      const posts = await getMyPosts(fastify.db, userId);
      return reply.code(200).send({ posts });
    },
  );

  // GET /posts - browse marketplace posts
  fastify.get(
    '/posts',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const userId = request.user.sub;
      const query = request.query as {
        type?: string;
        set?: string;
        rarity?: string;
        language?: string;
        search?: string;
        sort?: string;
        cursor?: string;
        limit?: string;
      };

      const result = await getPosts(fastify.db, userId, {
        type: query.type as any,
        setId: query.set,
        rarity: query.rarity,
        language: query.language,
        search: query.search,
        sort: (query.sort as any) || 'newest',
        cursor: query.cursor,
        limit: query.limit ? parseInt(query.limit, 10) : 20,
      });

      return reply.code(200).send(result);
    },
  );

  // PUT /posts/:id/close - close a post
  fastify.put(
    '/posts/:id/close',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const lang = parseAcceptLanguage(request.headers['accept-language']);
      const { id } = request.params as { id: string };
      const userId = request.user.sub;

      try {
        const post = await closePost(fastify.db, userId, id);
        return reply.code(200).send({ post });
      } catch (err: any) {
        const status = err.statusCode || 500;
        return reply.code(status).send({ error: err.message || t('errors.serverError', lang) });
      }
    },
  );

  // DELETE /posts/:id - delete a post
  fastify.delete(
    '/posts/:id',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const lang = parseAcceptLanguage(request.headers['accept-language']);
      const { id } = request.params as { id: string };
      const userId = request.user.sub;

      try {
        await deletePost(fastify.db, userId, id);
        return reply.code(204).send();
      } catch (err: any) {
        const status = err.statusCode || 500;
        return reply.code(status).send({ error: err.message || t('errors.serverError', lang) });
      }
    },
  );
}
