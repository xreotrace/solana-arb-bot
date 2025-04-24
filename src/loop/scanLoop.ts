import { fetchQuote } from "../utils/jupiterClient";
import { logQuote } from "../analytics/quoteLogger";
import dotenv from "dotenv";

dotenv.config();

const TRADE_THRESHOLD_USDC = parseFloat(
  process.env.TRADE_THRESHOLD_USDC || "0.01"
);

const TRADE_PAIRS = [
  {
    inputMint: "So11111111111111111111111111111111111111112",
    outputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  }, // SOL → USDC
  {
    inputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    outputMint: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
  }, // USDC → JUP
  {
    inputMint: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
    outputMint: "So11111111111111111111111111111111111111112",
  }, // JUP → SOL
];

const COMMON_PARAMS = {
  amount: 2 * 1e9, // 2 SOL or equivalent in input token
  slippageBps: 100,
  enforceSingleTx: true,
  allowIntermediateMints: true,
  onlyDirectRoutes: false,
};

export async function startScannerLoop() {
  while (true) {
    for (const pair of TRADE_PAIRS) {
      const config = { ...COMMON_PARAMS, ...pair };
      console.log("📡 Sending quote request:", config);

      try {
        const quote = await fetchQuote(config);

        if (!quote?.routePlan?.length) {
          console.warn("⚠️ No route found for:", pair);
          continue;
        }

        const inAmount = config.amount / 1e9;
        const outAmount = parseFloat(quote.outAmount) / 1e6;
        const marketPrice = quote.marketPrice ?? outAmount / inAmount;
        const expectedOut = inAmount * marketPrice;
        const profit = outAmount - expectedOut;

        logQuote({
          timestamp: new Date().toISOString(),
          inputMint: config.inputMint,
          outputMint: config.outputMint,
          inAmount,
          outAmount,
          profit,
          reason:
            profit <= TRADE_THRESHOLD_USDC
              ? "Profit below threshold"
              : "Viable (DRY-RUN)",
        });

        if (profit > TRADE_THRESHOLD_USDC) {
          console.log("✅ PROFITABLE ROUTE FOUND:", profit.toFixed(6), "USDC");
        }
      } catch (err) {
        console.error("🚨 Error scanning pair:", pair, err);
      }

      await new Promise((res) => setTimeout(res, 350)); // Respect Jupiter rate limits (60 req/min)
    }
  }
}
