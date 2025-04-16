import * as dotenv from "dotenv";
dotenv.config();

import { checkRaydiumPrice } from "./raydium";
import { checkOrcaPrice } from "./orca";
import { calculateProfitPercent } from "./utils";
import { simulateTrade } from "./simulator";
import { tryRealTrade } from "./trade";

const TOKENS = ["SOL/USDC", "SOL/USDT"];
const MIN_PROFIT = parseFloat(process.env.MIN_PROFIT_PERCENT || "0.5");
const TRADE_MODE = process.env.TRADE_MODE || "manual";

async function runBot() {
  console.log(
    `Starting Solana Arbitrage Bot with min profit ${MIN_PROFIT}%, mode=${TRADE_MODE}`
  );
  while (true) {
    for (const pair of TOKENS) {
      const raydium = await checkRaydiumPrice(pair);
      const orca = await checkOrcaPrice(pair);

      if (!raydium || !orca) continue;

      const profitRayToOrca = calculateProfitPercent(raydium.ask, orca.bid);
      const profitOrcaToRay = calculateProfitPercent(orca.ask, raydium.bid);

      if (profitRayToOrca >= MIN_PROFIT) {
        console.log(
          `📈 Arbitrage Found: Buy on Raydium at ${
            raydium.ask
          }, Sell on Orca at ${orca.bid} → Profit: ${profitRayToOrca.toFixed(
            2
          )}%`
        );
        await simulateTrade("Raydium", "Orca", pair, raydium.ask, orca.bid);
        if (TRADE_MODE === "auto")
          await tryRealTrade("Raydium", "Orca", pair, raydium.ask, orca.bid);
      }

      if (profitOrcaToRay >= MIN_PROFIT) {
        console.log(
          `📈 Arbitrage Found: Buy on Orca at ${orca.ask}, Sell on Raydium at ${
            raydium.bid
          } → Profit: ${profitOrcaToRay.toFixed(2)}%`
        );
        await simulateTrade("Orca", "Raydium", pair, orca.ask, raydium.bid);
        if (TRADE_MODE === "auto")
          await tryRealTrade("Orca", "Raydium", pair, orca.ask, raydium.bid);
      }
    }

    await new Promise((res) => setTimeout(res, 5000));
  }
}

runBot().catch(console.error);
