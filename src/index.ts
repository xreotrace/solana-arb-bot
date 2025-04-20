import * as dotenv from "dotenv";
dotenv.config();

import { getJupiterPrice } from "./jupiter";
import { calculateProfitPercent } from "./utils";
import { simulateTrade } from "./simulator";
import { tryRealTrade } from "./trade";
import { sendTelegramMessage } from "./notifier";

import { Connection, Keypair } from "@solana/web3.js";
import { getSolBalance } from "./solana";
import bs58 from "bs58";
import readline from "readline";

const TOKENS = ["SOL/USDC"];
const MIN_PROFIT = parseFloat(process.env.MIN_PROFIT_PERCENT || "0.5");
const TRADE_MODE = process.env.TRADE_MODE || "manual";

const connection = new Connection(process.env.RPC_URL!, "confirmed");
const secretKey = bs58.decode(process.env.PRIVATE_KEY!);
const keypair = Keypair.fromSecretKey(secretKey);

function getJupiterSwapLink(base: string, quote: string) {
  return `https://jup.ag/swap/${base}-${quote}`;
}

function getPoolExplorerLink(ammKey: string | null) {
  return ammKey ? `https://solscan.io/account/${ammKey}` : "N/A";
}

function askYesNo(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === "y");
    });
  });
}

async function runBot() {
  console.log(
    `🚀 Starting Solana Arbitrage Bot with min profit ${MIN_PROFIT}%, mode=${TRADE_MODE}`
  );

  while (true) {
    const solBalance = await getSolBalance(connection, keypair.publicKey);
    const tradeAmountLamports = 1_000_000_000; // 1 SOL

    for (const pair of TOKENS) {
      const [base, quote] = pair.split("/");
      const reversedPair = `${quote}/${base}`;

      const jupiterBuySell = await getJupiterPrice(pair, tradeAmountLamports);
      const jupiterSellBuy = await getJupiterPrice(
        reversedPair,
        tradeAmountLamports
      );

      if (!jupiterBuySell || !jupiterSellBuy) continue;

      console.log(`[BUY ➜ SELL] ${pair}`);
      console.log(`Ask (Buy Price): ${jupiterBuySell.ask}`);
      console.log(`Bid (Sell Price): ${jupiterBuySell.bid}`);
      const profitBuySell = calculateProfitPercent(
        jupiterBuySell.ask,
        jupiterBuySell.bid
      );

      console.log(`[BUY ➜ SELL] ${pair}`);
      console.log(`Ask (Buy Price): ${jupiterBuySell.ask}`);
      console.log(`Bid (Sell Price): ${jupiterBuySell.bid}`);
      const profitSellBuy = calculateProfitPercent(
        jupiterSellBuy.ask,
        jupiterSellBuy.bid
      );

      // Buy base, Sell quote
      if (profitBuySell >= MIN_PROFIT) {
        const buyLink = getJupiterSwapLink(base, quote);
        const sellLink = getJupiterSwapLink(quote, base);
        const buyPoolLink = getPoolExplorerLink(jupiterBuySell.ammKey);
        const sellPoolLink = getPoolExplorerLink(jupiterBuySell.ammKey);

        const msg = `📈 *Arbitrage Detected!*
Pair: *${pair}*
🔁 [Buy on Jupiter](${buyLink}) \`${jupiterBuySell.ask.toFixed(4)}\`
🔁 [Sell on Jupiter](${sellLink}) \`${jupiterBuySell.bid.toFixed(4)}\`
🔍 [Buy Pool](${buyPoolLink})
🔍 [Sell Pool](${sellPoolLink})
💰 Profit: *${profitBuySell.toFixed(2)}%*`;

        console.log(msg);
        await sendTelegramMessage(msg);
        await simulateTrade(
          "Jupiter",
          "Jupiter",
          pair,
          jupiterBuySell.ask,
          jupiterBuySell.bid
        );

        if (TRADE_MODE === "auto") {
          await tryRealTrade(
            "Jupiter",
            "Jupiter",
            pair,
            jupiterBuySell.ask,
            jupiterBuySell.bid
          );
        } else if (TRADE_MODE === "manual") {
          const confirmed = await askYesNo(
            "⚠️ Do you want to execute this trade? (y/n): "
          );
          if (confirmed) {
            await tryRealTrade(
              "Jupiter",
              "Jupiter",
              pair,
              jupiterBuySell.ask,
              jupiterBuySell.bid
            );
          } else {
            console.log("❌ Trade skipped.");
          }
        }
      }

      // Reversed: Buy quote, Sell base
      if (profitSellBuy >= MIN_PROFIT) {
        const buyLink = getJupiterSwapLink(quote, base);
        const sellLink = getJupiterSwapLink(base, quote);
        const buyPoolLink = getPoolExplorerLink(jupiterSellBuy.ammKey);
        const sellPoolLink = getPoolExplorerLink(jupiterSellBuy.ammKey);

        const msg = `📈 *Arbitrage Detected!*
Pair: *${reversedPair}*
🔁 [Buy on Jupiter](${buyLink}) \`${jupiterSellBuy.ask.toFixed(4)}\`
🔁 [Sell on Jupiter](${sellLink}) \`${jupiterSellBuy.bid.toFixed(4)}\`
🔍 [Buy Pool](${buyPoolLink})
🔍 [Sell Pool](${sellPoolLink})
💰 Profit: *${profitSellBuy.toFixed(2)}%*`;

        console.log(msg);
        await sendTelegramMessage(msg);
        await simulateTrade(
          "Jupiter",
          "Jupiter",
          reversedPair,
          jupiterSellBuy.ask,
          jupiterSellBuy.bid
        );

        if (TRADE_MODE === "auto") {
          await tryRealTrade(
            "Jupiter",
            "Jupiter",
            reversedPair,
            jupiterSellBuy.ask,
            jupiterSellBuy.bid
          );
        } else if (TRADE_MODE === "manual") {
          const confirmed = await askYesNo(
            "⚠️ Do you want to execute this trade? (y/n): "
          );
          if (confirmed) {
            await tryRealTrade(
              "Jupiter",
              "Jupiter",
              reversedPair,
              jupiterSellBuy.ask,
              jupiterSellBuy.bid
            );
          } else {
            console.log("❌ Trade skipped.");
          }
        }
      }
    }

    await new Promise((res) => setTimeout(res, 5000));
  }
}

runBot().catch(console.error);
