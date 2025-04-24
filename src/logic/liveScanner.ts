import { findBestMultiHopRoute } from "./multiHopRouter";
import dotenv from "dotenv";

dotenv.config();

const BASE_INTERVAL_MS = parseInt(process.env.SCAN_INTERVAL_MS || "5000");
const RATE_LIMIT_PER_MIN = 60;
const AVG_QUOTES_PER_SCAN = 9;
const MIN_SCAN_INTERVAL_MS = Math.ceil(
  (60_000 / RATE_LIMIT_PER_MIN) * AVG_QUOTES_PER_SCAN
);
const MAX_BACKOFF_MS = 60000; // Max wait: 60 seconds

let backoffFactor = 1;

export async function startLiveScanner() {
  console.log("🚀 Starting live scanner with exponential backoff enabled.");
  console.log("🔁 Base delay per scan:", MIN_SCAN_INTERVAL_MS, "ms");

  while (true) {
    const start = Date.now();

    try {
      const best = await findBestMultiHopRoute();
      if (!best) {
        console.log("⚠️ No arbitrage route found this cycle.");
      }

      // ✅ Success resets backoff
      backoffFactor = 1;
    } catch (err: any) {
      if (err?.response?.status === 429 || err?.message?.includes("429")) {
        backoffFactor *= 2;
        console.warn(
          `⏳ Rate limit hit! Increasing backoff (x${backoffFactor})`
        );
      } else {
        console.error("❌ Error during scan:", err.message);
      }
    }

    const delay = Math.min(
      MIN_SCAN_INTERVAL_MS * backoffFactor,
      MAX_BACKOFF_MS
    );
    const elapsed = Date.now() - start;
    const waitTime = Math.max(delay - elapsed, 1000);

    console.log(`⏱ Waiting ${waitTime} ms before next scan...\n`);
    await new Promise((res) => setTimeout(res, waitTime));
  }
}
