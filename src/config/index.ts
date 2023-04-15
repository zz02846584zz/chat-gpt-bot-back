const telegramToken = process.env.BOT_TOKEN || '';
const testTelegramToken = process.env.TEST_BOT_TOKEN || '';
const webhookDomain = process.env.TELEGRAM_WEBHOOK_DOMAIN || '';
const telegramBotPort = process.env.TELEGRAM_BOT_PORT || '5200';
export default {
  telegramToken,
  webhookDomain,
  testTelegramToken,
  telegramBotPort,
};
