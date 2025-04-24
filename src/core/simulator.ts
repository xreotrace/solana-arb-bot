import { QuoteParams, fetchQuote } from "../utils/jupiterClient";

export async function simulateTrade(config: QuoteParams) {
  console.log("🧪 Simulating trade with dry-run...");

  try {
    const quote = await fetchQuote(config);

    if (!quote?.data?.length) {
      console.log("⚠️ No simulated route found.");
      return null;
    }

    const bestRoute = quote.data[0];
    const input = config.amount / 1e9;
    const output = parseFloat(bestRoute.outAmount) / 1e6;
    const estProfit = output - input;

    console.log(
      `🔎 Simulation Result: Input ${input.toFixed(
        3
      )} SOL → Output ${output.toFixed(3)} USDC`
    );
    console.log(`📈 Estimated Profit: ${estProfit.toFixed(4)} USDC`);

    return {
      route: bestRoute,
      profit: estProfit,
    };
  } catch (err: any) {
    console.error("❌ Dry-run simulation failed:", err.message);
    return null;
  }
}
