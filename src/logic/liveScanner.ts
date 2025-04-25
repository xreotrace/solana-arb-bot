import { findBestMultiHopRoute } from "./multiHopRouter";
import { logQuote } from "../analytics/quoteLogger";
import dotenv from "dotenv";

dotenv.config();

const SCAN_INTERVAL_MS = parseInt(process.env.SCAN_INTERVAL_MS || "3000");

export async function startLiveScanner() {
  console.log("\uD83D\uDEA1 Starting live arbitrage scanner loop...");
  while (true) {
    try {
      const best = await findBestMultiHopRoute();

      if (!best) {
        console.log("\u26A0\uFE0F No arbitrage route found this cycle.");
      } else {
        // Log the final arbitrage opportunity found
        const timestamp = new Date().toISOString();
        const inputMint = best[0];
        const outputMint = best[best.length - 1];
        const inAmount = parseFloat((2).toFixed(9)); // 2 SOL assumed
        const outAmount = parseFloat((inAmount + 0.001).toFixed(9)); // example final amount
        const profit = parseFloat((outAmount - inAmount).toFixed(9));

        logQuote({
          timestamp,
          inputMint,
          outputMint,
          inAmount,
          outAmount,
          profit,
          reason: "Live Scan Arbitrage Detected",
        });
      }
    } catch (err: any) {
      console.error("\u274C Error during scan:", err.message);
    }
    await new Promise((res) => setTimeout(res, SCAN_INTERVAL_MS));
  }
}

// Optional entrypoint for direct execution
if (require.main === module) {
  startLiveScanner();
}
