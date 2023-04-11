import { Update } from 'telegraf/typings/core/types/typegram';
import fp from 'fastify-plugin';
import { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import { options } from '../app';
import { FastifyRegisterOptions } from 'fastify';
import { User } from '@prisma/client';

/**
 * Плагин для работы с телеграм ботом nika-gpt-bot
 *
 * @see later
 */
export default fp<FastifyRegisterOptions<{ telegramToken: string; webhookUrl: string }>>(async fastify => {
  fastify.register((fastify, opts, done) => {
    const bot = new Telegraf(opts.telegramToken);

    bot.command('start', async ctx => {
      const telegramId = ctx.message?.from?.id;
      const telegramName = `${ctx.message?.from?.first_name || ''} ${ctx.message?.from.last_name || ''}`;
      const telegramUsername = ctx.message?.from.username || '';
      try {
        const candidate = await fastify.prisma.user.findUnique({ where: { telegramId } });
        if (candidate) return ctx.reply('Привет, бот уже запущен!');
        const user = await fastify.prisma.user.create({
          data: {
            telegramId,
            telegramName,
            telegramUsername,
            roles: { connect: { key: 'user' } },
          },
        });
        let assistant = await fastify.prisma.user.findFirst({ where: { roles: { every: { key: 'assistant' } } } });
        if (!assistant) {
          assistant = await fastify.prisma.user.create({
            data: {
              telegramId,
              telegramName,
              telegramUsername,
              roles: { connect: { key: 'assistant' } },
            },
          });
        }
        await fastify.prisma.room.create({
          data: { users: { connect: [{ id: user.id }, { id: assistant.id }] } },
        });
      } catch (error) {
        console.error(error);
      }

      ctx.reply('Привет, это nika gpt bot!');
    });

    bot.command('genimg', async ctx => {
      const text = ctx.message.text.trim();
      const candidate = await fastify.prisma.user.findFirst({
        where: { telegramId: ctx.message.from.id },
        include: { rooms: true },
      });
      if (!candidate) return ctx.reply('Запустите бота командой /start и отправьте сообщение повторно');
      const command = '/genimg';
      await ctx.sendChatAction('upload_photo');
      const imgUrl = await fastify.generateChatGptImage(text.slice(command.length + 1));
      fastify.log.info(
        `Сгенерировано новое изображение от <${candidate.telegramName}>: <${candidate.id}> - <${imgUrl}>`
      );
      ctx.replyWithPhoto(imgUrl);
    });

    bot.catch((err, ctx) => {
      console.info(`Ooops, произошла ошибка для пользователя ${ctx.message?.from.id}`, err);
      ctx.reply('Ooops, произошла ошибка!');
    });

    bot.on(message('text'), async ctx => {
      const candidate = await fastify.prisma.user.findFirst({
        where: { telegramId: ctx.message.from.id },
        include: { rooms: true },
      });
      if (!candidate) return ctx.reply('Запустите бота командой /start и отправьте сообщение повторно');
      await ctx.sendChatAction('typing');

      const assistant = (await fastify.prisma.user.findFirst({
        where: { roles: { every: { key: 'assistant' } } },
      })) as User; // тут помощник точно есть, тк он создается при команде start
      const roomId = candidate.rooms[0].id;
      const newMsg = ctx.message.text.trim();
      const messages = await fastify.prisma.message.findMany({
        where: { roomId },
        include: { user: { include: { roles: true } } },
      });

      const botReplyMessage = await fastify.sendChatGptMsg(
        messages
          .map(msg => {
            const role = msg.user.roles[0].key === 'admin' ? 'user' : msg.user.roles[0].key;
            return { content: msg.content, name: msg.userId, role };
          })
          .concat({ content: newMsg, role: 'user', name: candidate.id })
      );

      await fastify.prisma.message.createMany({
        data: [
          { roomId, content: newMsg, userId: candidate.id },
          { roomId, content: botReplyMessage, userId: assistant.id },
        ],
      });

      fastify.log.info(`Новое сообщение от <${candidate.telegramName}>: <${candidate.id}> - <${newMsg}>`);

      await ctx.sendMessage(botReplyMessage, { reply_to_message_id: ctx.message.message_id });
    });

    if (process.env.NODE_ENV === 'prod') {
      bot.telegram.setWebhook(opts.webhookUrl);
      fastify.post(`/webhook/${opts.telegramToken}`, async (request, reply) => {
        const update = request.body as Update;
        await bot.handleUpdate(update);
        reply.send();
      });
    } else {
      bot.launch();
    }
    done();
  }, options.custom.telegramBot);
});
