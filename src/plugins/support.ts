import { PrismaClient } from '@prisma/client';
import fp from 'fastify-plugin';
import { OpenAIApi } from 'openai';

export interface SupportPluginOptions {
  // Specify Support plugin options here
}

// The use of fastify-plugin is required to be able
// to export the decorators to the outer scope
export default fp<SupportPluginOptions>(async (fastify, opts) => {});

// When using .decorate you have to specify added properties for Typescript
declare module 'fastify' {
  export interface FastifyInstance {
    sendChatGptMsg(msgs: { role: 'user' | 'assistant'; content: string; name: string }[]): Promise<string>;
    generateChatGptImage(prompt: string): Promise<string>;
    prisma: PrismaClient;
    openai: OpenAIApi;
  }
}
