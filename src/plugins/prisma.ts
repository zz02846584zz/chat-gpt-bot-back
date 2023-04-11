import fp from 'fastify-plugin';
import { PrismaClient } from '@prisma/client';

/**
 * prisma
 *
 * @see later
 */
export default fp(async fastify => {
  fastify.register(async () => {
    const prisma = new PrismaClient();

    await prisma.$connect();

    fastify.decorate('prisma', prisma);

    fastify.addHook('onClose', async () => {
      await fastify.prisma.$disconnect();
    });
  });
});
