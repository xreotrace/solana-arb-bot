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

// 🛠️ Fresh quote revalidation only for batch
async function revalidateBatchOpportunity(
  opportunity: ArbitrageOpportunity
): Promise<boolean> {
  if (opportunity.type !== "batch") return true; // Only batch needs revalidation

  try {
    const oldQuote = opportunity.details;
    const freshQuote = await getQuote(
      oldQuote.inAmountMint,
      oldQuote.outAmountMint,
      oldQuote.inAmount
    );

    const oldProfit = calculateNetProfit(oldQuote);
    const newProfit = calculateNetProfit(freshQuote);

    console.log(
      `🔁 Revalidating batch opportunity... Old Profit: ${oldProfit.toFixed(
        6
      )} → New Profit: ${newProfit.toFixed(6)} SOL`
    );

    return newProfit > 0;
  } catch (err: any) {
    console.error("❌ Error during revalidation:", err.message);
    return false;
  }
}

export async function startSmartScanner() {
  console.log("🤖 Starting optimized smart arbitrage scanner...");

  while (true) {
    try {
      console.log("🔍 Parallel scanning batch and multi-hop routes...");

      const batchQuotePromises = batchPairs
        .filter((pair) => pair.input !== pair.output)
        .map((pair) =>
          getQuote(pair.input, pair.output, TRADE_AMOUNT_LAMPORTS)
        );

      const multiHopPromise = findBestMultiHopRoute();

      const [batchResults, bestMultiHopRoute] = await Promise.all([
        Promise.allSettled(batchQuotePromises),
        multiHopPromise,
      ]);

      const batchOpportunities: ArbitrageOpportunity[] = batchResults
        .filter(
          (r): r is PromiseFulfilledResult<any> =>
            r.status === "fulfilled" && !!r.value
        )
        .map((r) => {
          const quote = r.value;
          const profit = calculateNetProfit(quote);
          return {
            type: "batch",
            profit,
            details: quote,
          };
        });

      let multiHopOpportunity: ArbitrageOpportunity | null = null;
      if (bestMultiHopRoute && bestMultiHopRoute.profitSOL > 0) {
        multiHopOpportunity = {
          type: "multiHop",
          profit: bestMultiHopRoute.profitSOL,
          details: bestMultiHopRoute,
        };
      }

      const allOpportunities = [...batchOpportunities];
      if (multiHopOpportunity) {
        allOpportunities.push(multiHopOpportunity);
      }

      if (allOpportunities.length > 0) {
        allOpportunities.sort((a, b) => b.profit - a.profit);
        const bestOpportunity = allOpportunities[0];

        if (bestOpportunity && bestOpportunity.profit > MIN_PROFIT_SOL) {
          console.log(
            `🏆 Best Opportunity: ${
              bestOpportunity.type
            } | Profit: ${bestOpportunity.profit.toFixed(6)} SOL`
          );

          // 🛠️ Fresh revalidate batch quote
          let isStillValid = true;
          if (bestOpportunity.type === "batch") {
            isStillValid = await revalidateBatchOpportunity(bestOpportunity);
          }

          if (!isStillValid) {
            console.warn(
              "⚠️ Opportunity no longer valid after fresh revalidation. Skipping execution."
            );
            await new Promise((resolve) =>
              setTimeout(resolve, SCAN_INTERVAL_MS)
            );
            continue;
          }

          // ✅ Now simulate or execute
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
              `🛤️ Multi-Hop Arbitrage Found! Chain: ${bestOpportunity.details.chain.join(
                " → "
              )}`
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
