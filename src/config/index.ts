const telegramToken = process.env.BOT_TOKEN || '';
export default {
  telegramToken,
  webhookUrl: `https://your-webhook-url.com/webhook/${telegramToken}`,
};
