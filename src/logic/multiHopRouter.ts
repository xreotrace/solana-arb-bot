// src/logic/multiHopRouter.ts

import { getQuote } from "../utils/jupiterClient";
import { logQuote } from "../analytics/quoteLogger";
import { logArbitrage } from "../analytics/arbitrageLogger";
import { fetchSOLPriceUSD } from "../utils/priceFetcher";
import { generateSmartChains } from "../utils/chainGenerator";
//import { MULTIHOP_CHAINS } from "../config/multihopChains";

const TRADE_AMOUNT_SOL = parseFloat(process.env.TRADE_AMOUNT_SOL || "2");
const CHAINS = generateSmartChains(TRADE_AMOUNT_SOL);
//const CHAINS = MULTIHOP_CHAINS; // Use the predefined chains for now
const SLIPPAGE_BPS = 100;
const TRADE_THRESHOLD_PERCENT = parseFloat(
  process.env.TRADE_THRESHOLD_PERCENT || "0.05"
);
const MIN_PROFIT_SOL = (TRADE_AMOUNT_SOL * TRADE_THRESHOLD_PERCENT) / 100;

const GAS_PER_SWAP_SOL = 0.00002;

export async function findBestMultiHopRoute(): Promise<{
  chain: string[];
  profitSOL: number;
  profitUSD: number;
} | null> {
  let bestChain: string[] = [];
  let maxAdjustedProfit = -Infinity;

  for (const path of CHAINS) {
    const routeProfit = await simulateMultiHopPath(path);

    if (
      routeProfit &&
      routeProfit.adjustedProfit > MIN_PROFIT_SOL &&
      routeProfit.adjustedProfit > maxAdjustedProfit
    ) {
      maxAdjustedProfit = routeProfit.adjustedProfit;
      bestChain = path;
    }
  }

  if (bestChain.length) {
    const solPrice = await fetchSOLPriceUSD();
    const profitUSD = maxAdjustedProfit * solPrice;

    console.log("🚀 Best Chain:", bestChain.join(" → "));
    console.log(
      `💰 Net Profit (after gas): ${maxAdjustedProfit.toFixed(
        6
      )} SOL ≈ $${profitUSD.toFixed(4)} USD`
    );

    logArbitrage({
      timestamp: new Date().toISOString(),
      chain: bestChain,
      inAmountSOL: TRADE_AMOUNT_SOL,
      outAmountSOL: TRADE_AMOUNT_SOL + maxAdjustedProfit,
      profitSOL: maxAdjustedProfit,
      profitUSD: profitUSD,
    });

    return {
      chain: bestChain,
      profitSOL: maxAdjustedProfit,
      profitUSD: profitUSD,
    };
  } else {
    console.log("❌ No profitable chained route found.");
    return null;
  }
}

async function simulateMultiHopPath(
  path: string[]
): Promise<{ adjustedProfit: number } | null> {
  let currentAmount = TRADE_AMOUNT_SOL * 1e9; // lamports
  let failed = false;

  for (let i = 0; i < path.length - 1; i++) {
    const inputMint = path[i];
    const outputMint = path[i + 1];

    if (inputMint === outputMint) {
      console.warn("⚠️ Skipping invalid path:", inputMint);
      failed = true;
      break;
    }

    try {
      const quote = await getQuote(inputMint, outputMint, currentAmount);

      if (!quote?.routePlan?.length) {
        failed = true;
        break;
      }

      const outAmount = parseFloat(quote.outAmount);
      logQuote({
        timestamp: new Date().toISOString(),
        inputMint,
        outputMint,
        inAmount: currentAmount,
        outAmount,
        profit: 0,
        reason: `Step ${i + 1}/${path.length - 1} in chain`,
      });

      currentAmount = outAmount;
    } catch (err: any) {
      console.error(
        "❌ Chain step failed:",
        inputMint,
        "→",
        outputMint,
        err.message
      );
      failed = true;
      break;
    }
  }

  if (failed) {
    return null;
  }

  const finalSOL = currentAmount / 1e9;
  const initialSOL = TRADE_AMOUNT_SOL;
  const rawProfit = finalSOL - initialSOL;
  const gasCostSOL = (path.length - 1) * GAS_PER_SWAP_SOL;
  const adjustedProfit = rawProfit - gasCostSOL;

  return { adjustedProfit };
}
