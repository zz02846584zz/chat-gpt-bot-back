import { join } from 'path';
import AutoLoad, { AutoloadPluginOptions } from '@fastify/autoload';
import { FastifyPluginAsync } from 'fastify';

import config from './config';
import { FastifyEnvOptions } from '@fastify/env';
const { telegramToken, webhookUrl } = config;

export type AppOptions = {
  // Place your custom options for app below here.
  custom: {
    telegramBot: {
      telegramToken: string;
      webhookUrl: string;
    };
    fastifyEnv: FastifyEnvOptions;
    openai: { apiKey: string };
  };
} & Partial<AutoloadPluginOptions>;

// Pass --options via CLI arguments in command to enable these options.

const schema = {
  type: 'object',
  required: ['PORT', 'BOT_TOKEN', 'NODE_ENV', 'OPENAI_API_KEY'],
  properties: {
    PORT: {
      type: 'string',
      default: 5100,
    },
    BOT_TOKEN: {
      type: 'string',
      default: '',
    },
    OPENAI_API_KEY: {
      type: 'string',
      default: '',
    },
    NODE_ENV: {
      type: 'string',
      default: 'dev',
    },
  },
};

const options: AppOptions = {
  custom: {
    openai: { apiKey: process.env.OPENAI_API_KEY || '' },
    telegramBot: {
      telegramToken,
      webhookUrl,
    },
    fastifyEnv: {
      confKey: 'config',
      dotenv: true,
      schema,
    },
  },
};

const app: FastifyPluginAsync<AppOptions> = async (fastify, opts): Promise<void> => {
  void fastify.register(AutoLoad, {
    dir: join(__dirname, 'plugins'),
    options: opts,
  });

  void fastify.register(AutoLoad, {
    dir: join(__dirname, 'routes'),
    options: opts,
  });
};

export default app;
export { app, options };
