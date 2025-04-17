import * as dotenv from "dotenv";
dotenv.config();

console.log("RPC_URL:", process.env.RPC_URL);
console.log("PRIVATE_KEY:", process.env.PRIVATE_KEY);

import { getJupiterPrice } from "./jupiter";
import { calculateProfitPercent } from "./utils";
import { simulateTrade } from "./simulator";
import { tryRealTrade } from "./trade";

const TOKENS = ["SOL/USDC"];
const MIN_PROFIT = parseFloat(process.env.MIN_PROFIT_PERCENT || "0.5");
const TRADE_MODE = process.env.TRADE_MODE || "manual";

async function runBot() {
  console.log(
    `Starting Solana Arbitrage Bot with min profit ${MIN_PROFIT}%, mode=${TRADE_MODE}`
  );
  while (true) {
    for (const pair of TOKENS) {
      const jupiterBuySell = await getJupiterPrice(pair); // buy base, sell quote
      const jupiterSellBuy = await getJupiterPrice(
        pair.split("/").reverse().join("/")
      ); // buy quote, sell base

      if (!jupiterBuySell || !jupiterSellBuy) continue;

      const profitBuySell = calculateProfitPercent(
        jupiterBuySell.ask,
        jupiterBuySell.bid
      );
      const profitSellBuy = calculateProfitPercent(
        jupiterSellBuy.ask,
        jupiterSellBuy.bid
      );

      if (profitBuySell >= MIN_PROFIT) {
        console.log(
          `📈 Arbitrage Found: Buy ${pair.split("/")[0]} at ${
            jupiterBuySell.ask
          }, Sell at ${jupiterBuySell.bid} → Profit: ${profitBuySell.toFixed(
            2
          )}%`
        );
        await simulateTrade(
          "Jupiter",
          "Jupiter",
          pair,
          jupiterBuySell.ask,
          jupiterBuySell.bid
        );
        if (TRADE_MODE === "auto")
          await tryRealTrade(
            "Jupiter",
            "Jupiter",
            pair,
            jupiterBuySell.ask,
            jupiterBuySell.bid
          );
      }

      if (profitSellBuy >= MIN_PROFIT) {
        console.log(
          `📈 Arbitrage Found: Buy ${pair.split("/")[1]} at ${
            jupiterSellBuy.ask
          }, Sell at ${jupiterSellBuy.bid} → Profit: ${profitSellBuy.toFixed(
            2
          )}%`
        );
        await simulateTrade(
          "Jupiter",
          "Jupiter",
          pair.split("/").reverse().join("/"),
          jupiterSellBuy.ask,
          jupiterSellBuy.bid
        );
        if (TRADE_MODE === "auto")
          await tryRealTrade(
            "Jupiter",
            "Jupiter",
            pair.split("/").reverse().join("/"),
            jupiterSellBuy.ask,
            jupiterSellBuy.bid
          );
      }
    }

    await new Promise((res) => setTimeout(res, 5000));
  }
}

runBot().catch(console.error);
