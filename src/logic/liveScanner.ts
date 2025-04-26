// src/logic/liveScanner.ts

import { logQuote } from "../analytics/quoteLogger";
import { getQuote } from "../utils/jupiterClient";
import dotenv from "dotenv";

dotenv.config();

const SCAN_INTERVAL_MS = parseInt(process.env.SCAN_INTERVAL_MS || "3000");
const TRADE_AMOUNT_SOL = parseFloat(process.env.TRADE_AMOUNT_SOL || "2"); // Dynamic from env
const TRADE_AMOUNT_LAMPORTS = TRADE_AMOUNT_SOL * 1e9;

import { TOKENS } from "../utils/tokens";
import { calculateNetProfit } from "../utils/profitCalculator";

const batchPairs = [
  { input: TOKENS.SOL, output: TOKENS.SOL },
  { input: TOKENS.SOL, output: TOKENS.USDC },
  { input: TOKENS.SOL, output: TOKENS.mSOL },
  { input: TOKENS.SOL, output: TOKENS.USDT },
];

export async function startLiveScanner() {
  console.log("💡 Starting live arbitrage scanner loop...");

  while (true) {
    try {
      console.log("🔎 Scanning batch routes...");

      const quotePromises = batchPairs.map((pair) =>
        getQuote(pair.input, pair.output, TRADE_AMOUNT_LAMPORTS)
      );

      const quoteResults = await Promise.allSettled(quotePromises);

      let profitableRoutes = [];

      for (const result of quoteResults) {
        if (result.status === "fulfilled" && result.value) {
          const quote = result.value;
          const profit = calculateNetProfit(quote);
          if (profit > 0) {
            profitableRoutes.push({ quote, profit });
          }
        }
      }

      if (profitableRoutes.length > 0) {
        profitableRoutes.sort((a, b) => b.profit - a.profit);
        const best = profitableRoutes[0].quote;

        const timestamp = new Date().toISOString();
        const inputMint = best.inAmountMint;
        const outputMint = best.outAmountMint;
        const inAmount = best.inAmount / 1e9;
        const outAmount = best.outAmount / 1e9;
        const profit = outAmount - inAmount;

        logQuote({
          timestamp,
          inputMint,
          outputMint,
          inAmount,
          outAmount,
          profit,
          reason: "Live Scan Arbitrage Detected",
        });
      } else {
        console.log("⚠️ No arbitrage route found this cycle.");
      }
    } catch (err: any) {
      console.error("❌ Error during scan:", err.message);
    }

    await new Promise((res) => setTimeout(res, SCAN_INTERVAL_MS));
  }
}

if (require.main === module) {
  startLiveScanner();
}
