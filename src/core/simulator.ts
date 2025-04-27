// src/core/simulator.ts

import { QuoteParams, fetchQuote } from "../utils/jupiterClient";

export async function simulateTrade(tradeData: any) {
  console.log("🧪 Simulating trade with dry-run...");

  try {
    let inputAmountLamports: number;
    let outputAmountLamports: number;

    if (tradeData.inAmount && tradeData.outAmount) {
      // 📦 Batch quote format
      inputAmountLamports = tradeData.inAmount;
      outputAmountLamports = tradeData.outAmount;
    } else if (
      tradeData.route &&
      tradeData.route.inAmount &&
      tradeData.route.outAmount
    ) {
      // 🛤️ Multi-hop route format
      inputAmountLamports = tradeData.route.inAmount;
      outputAmountLamports = tradeData.route.outAmount;
    } else {
      throw new Error("Unknown trade data format in simulateTrade!");
    }

    const inputSOL = inputAmountLamports / 1e9;
    const outputSOL = outputAmountLamports / 1e9;
    const estProfitSOL = outputSOL - inputSOL;

    console.log(
      `🔎 Simulation Result: Input ${inputSOL.toFixed(
        6
      )} SOL → Output ${outputSOL.toFixed(6)} SOL`
    );
    console.log(`📈 Estimated Profit: ${estProfitSOL.toFixed(6)} SOL`);

    return {
      input: inputSOL,
      output: outputSOL,
      profit: estProfitSOL,
    };
  } catch (err: any) {
    console.error("❌ Dry-run simulation failed:", err.message);
    return null;
  }
}
