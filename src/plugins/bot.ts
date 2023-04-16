import fp from 'fastify-plugin';
import { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import { options } from '../app';
import { User } from '@prisma/client';
import * as crypto from 'node:crypto';
import { Update } from 'telegraf/typings/core/types/typegram';

/**
 * Плагин для работы с телеграм ботом nika-gpt-bot
 *
 * @see later
 */
export default fp(async fastify => {
  fastify.register(async (fastify, opts, done) => {
    const bot = new Telegraf(process.env.NODE_ENV == 'prod' ? opts.telegramToken : opts.testTelegramToken);

    bot.use(async (ctx, next) => {
      const telegramId = ctx?.message?.from.id;
      if (!telegramId) return next();
      const candidate = await fastify.prisma.user.findFirst({
        where: { telegramId: ctx.message.from.id },
        select: { banned: true, ban_reason: true },
      });
      const member = await bot.telegram.getChatMember(opts.telegramBotChannelUsername, telegramId);
      ctx.subscribedToChannel = ['member', 'administrator', 'creator'].includes(member.status);
      if (candidate?.banned) return ctx.reply(`Нет доступа. Причина: ${candidate.ban_reason}`);
      next();
    });

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
              telegramId: 0,
              telegramName: 'nika-gpt-assistant',
              telegramUsername: 'nika-gpt-assistant',
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

    bot.catch((err, ctx) => {
      fastify.log.error(`Ooops, произошла ошибка для пользователя ${ctx.message?.from.id} - ${err}`);
      ctx.reply('Ooops, произошла ошибка!');
    });

    bot.command('genimg', async ctx => {
      ctx.sendChatAction('upload_photo');

      const text = ctx.message.text.trim();
      const command = '/genimg';

      const candidate = await fastify.prisma.user.findFirst({
        where: { telegramId: ctx.message.from.id },
        include: { rooms: true },
      });

      if (!candidate) return ctx.reply('Запустите бота командой /start и отправьте сообщение повторно');
      if (candidate.banned) return ctx.reply(`Нет доступа. Причина: ${candidate.ban_reason}`);

      const imgUrl = await fastify.generateChatGptImage(text.slice(command.length + 1));
      fastify.log.info(
        `Сгенерировано новое изображение от <${candidate?.telegramName}>: <${candidate?.id}> - <${imgUrl}>`
      );
      ctx.replyWithPhoto(imgUrl);
    });

    bot.on(message('text'), async ctx => {
      ctx.sendChatAction('typing');

      if (!ctx.subscribedToChannel) {
        return ctx.reply('Чтобы пользоваться ботом, пожалуйста, подпишитесь на новостной канал - это бесплатно!', {
          reply_markup: {
            inline_keyboard: [[{ text: 'Подписаться', url: opts.telegramBotChannelInviteLink }]],
          },
        });
      }

      const candidate = await fastify.prisma.user.findFirst({
        where: { telegramId: ctx.message.from.id },
        include: { rooms: true },
      });

      if (!candidate) return ctx.reply('Запустите бота командой /start и отправьте сообщение повторно');

      const assistant = (await fastify.prisma.user.findFirst({
        where: { roles: { every: { key: 'assistant' } } },
      })) as User; // тут помощник точно есть, тк он создается при команде start
      let roomId = candidate.rooms?.[0]?.id;
      if (!roomId) {
        const room = await fastify.prisma.room.create({
          data: { users: { connect: [{ id: candidate.id }, { id: assistant.id }] } },
        });
        roomId = room.id;
      }
      const newMsg = ctx.message.text.trim();
      const messages = await fastify.prisma.message.findMany({
        where: { roomId },
        include: { user: { include: { roles: true } } },
        orderBy: { createdAt: 'desc' },
        take: 20,
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

      await ctx.sendMessage(botReplyMessage, { reply_to_message_id: ctx.message.message_id });

      fastify.log.info(`Новое сообщение от <${candidate.telegramName}>: <${candidate.id}> - <${newMsg}>`);
    });

    if (process.env.NODE_ENV === 'dev') {
      bot.launch();
    } else {
      bot.launch({
        webhook: {
          domain: opts.webhookDomain,
          secretToken: crypto.randomBytes(64).toString('hex'),
        },
      });
      fastify.post(`/telegraf/${bot.secretPathComponent()}`, (req, rep) => {
        bot.handleUpdate(req.body as Update, rep.raw);
      });
    }

    done();
  }, options.custom.telegramBot);
});

declare module 'telegraf' {
  export interface Context {
    subscribedToChannel: boolean;
  }
}
