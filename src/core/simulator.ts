// src/core/simulator.ts

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
    } else if (tradeData.inAmountSOL && tradeData.outAmountSOL) {
      // 🛤️ Multi-hop route format (smartScanner structure)
      inputAmountSOL = tradeData.inAmountSOL;
      outputAmountSOL = tradeData.outAmountSOL;
      estProfitSOL = outputAmountSOL - inputAmountSOL;

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
