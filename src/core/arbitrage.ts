import { fetchQuote } from "../utils/jupiterClient";
import { logQuote } from "../analytics/quoteLogger";
import { Keypair, Connection } from "@solana/web3.js";
import dotenv from "dotenv";
import bs58 from "bs58";

dotenv.config();

const connection = new Connection(process.env.RPC_URL!);
const userKeypair = Keypair.fromSecretKey(
  bs58.decode(process.env.PRIVATE_KEY_BASE58!)
);

const TRADE_CONFIG = {
  inputMint: "So11111111111111111111111111111111111111112", // SOL
  outputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC
  amount: 2 * 1e9, // 0.005 SOL
  slippageBps: 100, // increase to 1% for more flexibility
  enforceSingleTx: true,
  allowIntermediateMints: true,
  onlyDirectRoutes: false, // ✅ this helps Jupiter search broader paths
};

export async function runArbitrage() {
  console.log(
    "🔍 Fetching forward (SOL → USDC) and reverse (USDC → SOL) routes..."
  );

  const forwardQuote = await fetchQuote({
    inputMint: "So11111111111111111111111111111111111111112", // SOL
    outputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC
    amount: 2 * 1e9, // 2 SOL
    slippageBps: 100,
    enforceSingleTx: true,
    allowIntermediateMints: true,
    onlyDirectRoutes: false,
  });

  if (!forwardQuote?.routePlan?.length) {
    console.warn("⚠️ No forward route found.");
    return;
  }

  const usdcAmount = parseFloat(forwardQuote.outAmount); // in USDC micro-units

  const reverseQuote = await fetchQuote({
    inputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC
    outputMint: "So11111111111111111111111111111111111111112", // SOL
    amount: usdcAmount, // use forward output
    slippageBps: 100,
    enforceSingleTx: true,
    allowIntermediateMints: true,
    onlyDirectRoutes: false,
  });

  if (!reverseQuote?.routePlan?.length) {
    console.warn("⚠️ No reverse route found.");
    return;
  }

  const solReceived = parseFloat(reverseQuote.outAmount) / 1e9;
  const solSent = 2.0;
  const profit = solReceived - solSent;

  console.log(`🔁 Round-trip trade simulation (SOL → USDC → SOL)`);
  console.log(`🔸 Sent: ${solSent.toFixed(6)} SOL`);
  console.log(`🔸 Received: ${solReceived.toFixed(6)} SOL`);
  console.log(`💸 Net Profit: ${profit.toFixed(9)} SOL`);

  logQuote({
    timestamp: new Date().toISOString(),
    inputMint: "So11111111111111111111111111111111111111112",
    outputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    inAmount: solSent,
    outAmount: solReceived,
    profit,
    reason: profit <= 0.00001 ? "Profit below threshold" : "Viable (DRY-RUN)",
  });

  if (profit <= 0.00001) {
    console.log("❌ Skipping: Profit below threshold");
    return;
  }

  console.log("✅ Viable arbitrage opportunity detected!");
  console.log("🧪 DRY-RUN ONLY — no transactions will be broadcast.");
}
