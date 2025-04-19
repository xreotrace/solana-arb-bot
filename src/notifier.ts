const TelegramBot = require("node-telegram-bot-api");

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID!;

const bot = new TelegramBot(BOT_TOKEN, { polling: false });

export async function sendTelegramMessage(message: string) {
  try {
    await bot.sendMessage(CHAT_ID, message, { parse_mode: "Markdown" });
  } catch (err: any) {
    console.error("❌ Telegram Error:", err.message);
  }
}
