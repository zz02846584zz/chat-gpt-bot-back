const telegramToken = process.env.BOT_TOKEN as string;
const testTelegramToken = process.env.TEST_BOT_TOKEN as string;
const webhookDomain = process.env.TELEGRAM_WEBHOOK_DOMAIN as string;
const telegramBotPort = process.env.TELEGRAM_BOT_PORT as string;
const telegramBotChannelInviteLink = process.env.TELEGRAM_BOT_CHANNEL_INVITE_LINK as string;
const telegramBotChannelUsername = process.env.TELEGRAM_BOT_CHANNEL_USERNAME as string;
export default {
  telegramToken,
  telegramBotChannelInviteLink,
  telegramBotChannelUsername,
  webhookDomain,
  testTelegramToken,
  telegramBotPort,
};
