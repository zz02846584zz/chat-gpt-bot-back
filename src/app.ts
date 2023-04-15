import { join } from 'path';
import AutoLoad, { AutoloadPluginOptions } from '@fastify/autoload';
import { FastifyPluginAsync } from 'fastify';

import config from './config';
import { FastifyEnvOptions } from '@fastify/env';
const { telegramToken, webhookDomain, telegramBotPort, testTelegramToken } = config;

export type AppOptions = {
  // Place your custom options for app below here.
  custom: {
    telegramBot: {
      telegramToken: string;
      testTelegramToken: string;
      webhookDomain: string;
      telegramBotPort: string;
    };
    fastifyEnv: FastifyEnvOptions;
    openai: { apiKey: string };
  };
} & Partial<AutoloadPluginOptions>;

// Pass --options via CLI arguments in command to enable these options.

const schema = {
  type: 'object',
  required: ['PORT', 'BOT_TOKEN', 'TEST_BOT_TOKEN', 'NODE_ENV', 'OPENAI_API_KEY', 'TELEGRAM_WEBHOOK_DOMAIN'],
  properties: {
    PORT: {
      type: 'number',
      default: 5100,
    },
    TELEGRAM_BOT_PORT: {
      type: 'number',
      default: 5200,
    },
    BOT_TOKEN: {
      type: 'string',
      default: '',
    },
    TELEGRAM_WEBHOOK_DOMAIN: {
      type: 'string',
      default: '',
    },
    TEST_BOT_TOKEN: {
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
      testTelegramToken,
      webhookDomain,
      telegramBotPort,
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
