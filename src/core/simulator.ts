// src/core/simulator.ts

import dotenv from "dotenv";
dotenv.config();

// Dynamically load trade amount from .env
const TRADE_AMOUNT_SOL = parseFloat(process.env.TRADE_AMOUNT_SOL || "2");

export async function simulateTrade(tradeData: any) {
  console.log("🧪 Simulating trade with dry-run...");

  try {
    let inputAmountSOL: number;
    let outputAmountSOL: number;
    let estProfitSOL: number;

    if (tradeData.inAmount && tradeData.outAmount) {
      // 📦 Batch or single-hop quote format
      inputAmountSOL = tradeData.inAmount / 1e9;
      outputAmountSOL = tradeData.outAmount / 1e9;
      estProfitSOL = outputAmountSOL - inputAmountSOL;

      console.log("📦 Batch Quote Detected!");
    } else if (tradeData.chain && tradeData.profitSOL) {
      // 🛤️ Multi-Hop route format
      inputAmountSOL = TRADE_AMOUNT_SOL;
      outputAmountSOL = TRADE_AMOUNT_SOL + tradeData.profitSOL;
      estProfitSOL = tradeData.profitSOL;

      console.log("🛤️ Multi-Hop Route Detected!");
    } else {
      throw new Error("Unknown trade data format in simulateTrade!");
    }

    console.log(
      `🔎 Simulation Result: Input ${inputAmountSOL.toFixed(
        6
      )} SOL → Output ${outputAmountSOL.toFixed(6)} SOL`
    );
    console.log(`📈 Estimated Profit: ${estProfitSOL.toFixed(6)} SOL`);

    return {
      input: inputAmountSOL,
      output: outputAmountSOL,
      profit: estProfitSOL,
    };
  } catch (err: any) {
    console.error("❌ Dry-run simulation failed:", err.message);
    return null;
  }
}
