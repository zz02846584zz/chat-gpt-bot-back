import { FastifyPluginAsync } from 'fastify';

const user: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  fastify.get('/', async function (request, reply) {
    return await fastify.prisma.user.findMany();
  });
};

export default user;
