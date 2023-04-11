import fp from 'fastify-plugin';
import { FastifyRegisterOptions } from 'fastify';
import { Configuration, OpenAIApi } from 'openai';
import { options } from '../app';

/**
 * openai
 *
 * @see later
 */
export default fp<FastifyRegisterOptions<{ apiKey: string }>>(async fastify => {
  async function sendChatGptMsg(messages: { role: 'user' | 'assistant'; content: string; name: string }[]) {
    const completions = await fastify.openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages,
    });

    const message = completions?.data.choices[0].message?.content.trim();
    return message;
  }

  async function generateChatGptImage(prompt: string) {
    const result = await fastify.openai.createImage({
      prompt,
    });
    return result.data.data[0]?.url;
  }

  fastify.register(async (server, { apiKey }) => {
    const configuration = new Configuration({ apiKey });
    const openai = new OpenAIApi(configuration);

    fastify.decorate('openai', openai);
    fastify.decorate('sendChatGptMsg', sendChatGptMsg);
    fastify.decorate('generateChatGptImage', generateChatGptImage);
  }, options.custom.openai);
});
