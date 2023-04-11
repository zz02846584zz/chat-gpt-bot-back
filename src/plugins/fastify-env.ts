import { FastifyRegisterOptions } from 'fastify';
import fastifyEnv, { FastifyEnvOptions } from '@fastify/env';
import fp from 'fastify-plugin';
import { options } from '../app';

/**
 * env
 *
 * @see https://github.com/fastify/fastify-env
 */
export default fp<FastifyRegisterOptions<FastifyEnvOptions>>(async fastify => {
  fastify.register(fastifyEnv, options.custom.fastifyEnv);
});
