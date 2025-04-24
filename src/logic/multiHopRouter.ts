import { fetchQuote } from "../utils/jupiterClient";
import { QuoteParams } from "../utils/jupiterClient";
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

const chains = [
  [TOKENS.SOL, TOKENS.USDC, TOKENS.JUP, TOKENS.SOL],
  [TOKENS.SOL, TOKENS.USDT, TOKENS.JUP, TOKENS.SOL],
  [TOKENS.SOL, TOKENS.USDC, TOKENS.mSOL, TOKENS.SOL],
];

export async function findBestMultiHopRoute(): Promise<any[] | null> {
  let bestChain: any[] = [];
  let maxProfit = -Infinity;

  for (const path of chains) {
    let currentAmount = tradeAmount;
    let failed = false;

    for (let i = 0; i < path.length - 1; i++) {
      const inputMint = path[i];
      const outputMint = path[i + 1];

      const config: QuoteParams = {
        inputMint,
        outputMint,
        amount: currentAmount,
        slippageBps,
        enforceSingleTx: true,
        allowIntermediateMints: true,
        onlyDirectRoutes: false,
      };

      try {
        const quote = await fetchQuote(config);
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
      const profit = finalSOL - initialSOL;

      if (profit > MIN_PROFIT_SOL && profit > maxProfit) {
        maxProfit = profit;
        bestChain = path;
      }
    }
  }

  if (bestChain.length) {
    const finalSOL = tradeAmount / 1e9 + maxProfit;
    const solPrice = await fetchSOLPriceUSD();
    const usdProfit = maxProfit * solPrice;

    console.log("🚀 Best Chain:", bestChain.join(" → "));
    console.log(
      `💰 Max Profit: ${maxProfit.toFixed(6)} SOL ≈ $${usdProfit.toFixed(
        4
      )} USD`
    );

    logArbitrage({
      timestamp: new Date().toISOString(),
      chain: bestChain,
      inAmountSOL: tradeAmount / 1e9,
      outAmountSOL: finalSOL,
      profitSOL: maxProfit,
      profitUSD: usdProfit,
    });

    return bestChain;
  } else {
    console.log("❌ No profitable chained route found.");
    return null;
  }
}
