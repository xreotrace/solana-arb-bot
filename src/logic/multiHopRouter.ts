// src/logic/multiHopRouter.ts

import { fetchQuote } from "../utils/jupiterClient";
import { QuoteParams } from "../utils/jupiterClient";
import { logQuote } from "../analytics/quoteLogger";

const TOKENS = {
  SOL: "So11111111111111111111111111111111111111112",
  USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  USDT: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
  JUP: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
  mSOL: "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",
};

const TOKEN_DECIMALS: Record<string, number> = {
  [TOKENS.SOL]: 9,
  [TOKENS.USDC]: 6,
  [TOKENS.USDT]: 6,
  [TOKENS.JUP]: 6,
  [TOKENS.mSOL]: 9,
};

const tradeAmount = 2 * 1e9; // 2 SOL in lamports
const slippageBps = 100; // 1%
const MIN_PROFIT_USDC = parseFloat(process.env.TRADE_THRESHOLD_USDC || "0.01");

const chains = [
  [TOKENS.SOL, TOKENS.USDC, TOKENS.JUP, TOKENS.SOL],
  [TOKENS.SOL, TOKENS.USDT, TOKENS.JUP, TOKENS.SOL],
  [TOKENS.SOL, TOKENS.USDC, TOKENS.mSOL, TOKENS.SOL],
];

export async function findBestMultiHopRoute(): Promise<any | null> {
  let bestChain: any[] = [];
  let maxProfit = -Infinity;

  for (const path of chains) {
    let currentAmount = tradeAmount;
    let failed = false;
    const stepLogs: any[] = [];

    for (let i = 0; i < path.length - 1; i++) {
      const inputMint = path[i];
      const outputMint = path[i + 1];

      const config: QuoteParams = {
        inputMint,
        outputMint,
        amount: Math.floor(currentAmount),
        slippageBps,
        enforceSingleTx: true,
        allowIntermediateMints: true,
        onlyDirectRoutes: false,
      };

      try {
        const quote = await fetchQuote(config);
        if (!quote?.routePlan?.length || !quote.outAmount) {
          failed = true;
          break;
        }

        const outAmount = parseFloat(quote.outAmount);

        // Log raw step info
        stepLogs.push({
          timestamp: new Date().toISOString(),
          inputMint,
          outputMint,
          inAmount: currentAmount,
          outAmount,
          profit: 0,
          reason: `Step ${i + 1}/${path.length - 1} in chain`,
        });

        // Prepare input for next step
        currentAmount = outAmount;
      } catch (err: any) {
        console.error(
          `❌ Failed on ${inputMint} → ${outputMint}:`,
          err.message
        );
        failed = true;
        break;
      }
    }

    if (!failed && stepLogs.length > 0) {
      const first = stepLogs[0];
      const last = stepLogs[stepLogs.length - 1];

      // Convert input/output to SOL (1e9)
      const inputSOL = first.inAmount / 1e9;
      const finalSOL = last.outAmount / 1e9;
      const profit = finalSOL - inputSOL;

      for (const log of stepLogs) logQuote(log);

      if (profit > MIN_PROFIT_USDC && profit > maxProfit) {
        bestChain = path;
        maxProfit = profit;
      }
    }
  }

  if (bestChain.length) {
    console.log("🚀 Best Chain:", bestChain.join(" → "));
    console.log(`💰 Max Profit: ${maxProfit.toFixed(9)} SOL`);
    return bestChain;
  } else {
    console.log("❌ No profitable chained route found.");
    return null;
  }
}
