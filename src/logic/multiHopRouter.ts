// src/logic/multiHopRouter.ts

import { fetchQuote } from "../utils/jupiterClient";
import { logQuote } from "../analytics/quoteLogger";
import { logArbitrage } from "../analytics/arbitrageLogger";
import { fetchSOLPriceUSD } from "../utils/priceFetcher";

const TOKENS = {
  SOL: "So11111111111111111111111111111111111111112",
  USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  USDT: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
  JUP: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
  mSOL: "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",
};

const tradeAmount = 2 * 1e9; // 2 SOL in lamports
const slippageBps = 100;
const MIN_PROFIT_SOL = parseFloat(process.env.TRADE_THRESHOLD_SOL || "0.0001");

// ✅ Gas awareness constants
const GAS_PER_SWAP_SOL = 0.00002; // assume ~0.00002 SOL gas cost per swap

const chains = [
  [TOKENS.SOL, TOKENS.USDC, TOKENS.JUP, TOKENS.SOL],
  [TOKENS.SOL, TOKENS.USDT, TOKENS.JUP, TOKENS.SOL],
  [TOKENS.SOL, TOKENS.USDC, TOKENS.mSOL, TOKENS.SOL],
];

export async function findBestMultiHopRoute(): Promise<any[] | null> {
  let bestChain: any[] = [];
  let maxAdjustedProfit = -Infinity;

  for (const path of chains) {
    let currentAmount = tradeAmount;
    let failed = false;

    for (let i = 0; i < path.length - 1; i++) {
      const inputMint = path[i];
      const outputMint = path[i + 1];

      if (inputMint === outputMint) {
        console.warn(
          "⚠️ Skipping invalid path with identical mints:",
          inputMint
        );
        failed = true;
        break;
      }

      try {
        const quote = await fetchQuote({
          inputMint,
          outputMint,
          amount: currentAmount,
          slippageBps,
          enforceSingleTx: true,
          allowIntermediateMints: true,
          onlyDirectRoutes: false,
        });

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

    if (!failed) {
      const finalSOL = currentAmount / 1e9;
      const initialSOL = tradeAmount / 1e9;
      const rawProfit = finalSOL - initialSOL;

      const gasCostSOL = (path.length - 1) * GAS_PER_SWAP_SOL;
      const adjustedProfit = rawProfit - gasCostSOL;

      if (
        adjustedProfit > MIN_PROFIT_SOL &&
        adjustedProfit > maxAdjustedProfit
      ) {
        maxAdjustedProfit = adjustedProfit;
        bestChain = path;
      }
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
      inAmountSOL: tradeAmount / 1e9,
      outAmountSOL: tradeAmount / 1e9 + maxAdjustedProfit,
      profitSOL: maxAdjustedProfit,
      profitUSD: profitUSD,
    });

    return bestChain;
  } else {
    console.log("❌ No profitable chained route found.");
    return null;
  }
}
