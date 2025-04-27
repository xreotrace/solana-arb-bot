// src/logic/smartScanner.ts

import dotenv from "dotenv";
dotenv.config();

import { getQuote } from "../utils/jupiterClient";
import { findBestMultiHopRoute } from "./multiHopRouter";
import { logQuote } from "../analytics/quoteLogger";
import { TOKENS } from "../utils/tokens";
import { calculateNetProfit } from "../utils/profitCalculator";
import { simulateTrade } from "../core/simulator";
import { executeTrade } from "../core/swapExecutor";

const SCAN_INTERVAL_MS = parseInt(process.env.SCAN_INTERVAL_MS || "3000");
const TRADE_AMOUNT_SOL = parseFloat(process.env.TRADE_AMOUNT_SOL || "2");
const TRADE_AMOUNT_LAMPORTS = TRADE_AMOUNT_SOL * 1e9;
const MIN_PROFIT_SOL = parseFloat(process.env.TRADE_THRESHOLD_SOL || "0.0001");
const DRY_RUN_MODE = process.env.DRY_RUN_MODE === "true";

const batchPairs = [
  { input: TOKENS.SOL, output: TOKENS.USDC },
  { input: TOKENS.SOL, output: TOKENS.mSOL },
  { input: TOKENS.SOL, output: TOKENS.USDT },
  { input: TOKENS.SOL, output: TOKENS.JUP },
];

interface ArbitrageOpportunity {
  type: "batch" | "multiHop";
  profit: number;
  details: any;
}

export async function startSmartScanner() {
  console.log("🤖 Starting smart arbitrage scanner...");

  while (true) {
    try {
      console.log("🔍 Scanning batch and multi-hop routes...");

      // 🛠️ Parallel batch quote sending
      const batchQuotePromises = batchPairs
        .filter((pair) => pair.input !== pair.output) // 🛡️ Skip identical input/output
        .map((pair) =>
          getQuote(pair.input, pair.output, TRADE_AMOUNT_LAMPORTS)
        );

      const batchResults = await Promise.allSettled(batchQuotePromises);

      const batchOpportunities: ArbitrageOpportunity[] = batchResults
        .filter(
          (result): result is PromiseFulfilledResult<any> =>
            result.status === "fulfilled" && !!result.value
        )
        .map((result) => {
          const quote = result.value;
          const profit = calculateNetProfit(quote);
          return {
            type: "batch",
            profit,
            details: quote,
          };
        });

      const bestMultiHopRoute = await findBestMultiHopRoute();

      let multiHopOpportunity: ArbitrageOpportunity | null = null;
      if (bestMultiHopRoute) {
        const profitSOL = bestMultiHopRoute.profitSOL || 0;
        if (profitSOL > 0) {
          multiHopOpportunity = {
            type: "multiHop",
            profit: profitSOL,
            details: bestMultiHopRoute,
          };
        }
      }

      const allOpportunities: ArbitrageOpportunity[] = [...batchOpportunities];
      if (multiHopOpportunity) {
        allOpportunities.push(multiHopOpportunity);
      }

      if (allOpportunities.length > 0) {
        allOpportunities.sort((a, b) => b.profit - a.profit);
        const bestOpportunity = allOpportunities[0];

        if (bestOpportunity && bestOpportunity.profit > MIN_PROFIT_SOL) {
          console.log(
            "🏆 Best Opportunity:",
            bestOpportunity.type,
            "Profit:",
            bestOpportunity.profit.toFixed(6),
            "SOL"
          );

          if (bestOpportunity.type === "batch") {
            const quote = bestOpportunity.details;
            const timestamp = new Date().toISOString();
            const inputMint = quote.inAmountMint;
            const outputMint = quote.outAmountMint;
            const inAmount = quote.inAmount / 1e9;
            const outAmount = quote.outAmount / 1e9;
            const profit = outAmount - inAmount;

            logQuote({
              timestamp,
              inputMint,
              outputMint,
              inAmount,
              outAmount,
              profit,
              reason: "Smart Scanner Batch Arbitrage",
            });

            if (DRY_RUN_MODE) {
              await simulateTrade(quote);
            } else {
              await executeTrade(quote);
            }
          } else if (bestOpportunity.type === "multiHop") {
            console.log(
              "🛤️ Multi-Hop Arbitrage Found! Chain:",
              bestOpportunity.details.chain.join(" → ")
            );

            if (DRY_RUN_MODE) {
              await simulateTrade(bestOpportunity.details);
            } else {
              await executeTrade(bestOpportunity.details);
            }
          }
        } else {
          console.log("⚠️ No profitable opportunities found.");
        }
      } else {
        console.log("⚠️ No opportunities found.");
      }
    } catch (err: any) {
      console.error("❌ Error during smart scan:", err.message);
    }

    await new Promise((resolve) => setTimeout(resolve, SCAN_INTERVAL_MS));
  }
}

if (require.main === module) {
  startSmartScanner();
}
