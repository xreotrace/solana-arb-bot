import { Connection, PublicKey } from "@solana/web3.js";

const VOLATILITY_THRESHOLD = 0.03; // 3% price change
const DEFAULT_CAPITAL = 1.95 * 1e9; // 1.95 SOL in lamports
const SAFE_CAPITAL = 1.5 * 1e9; // 1.5 SOL in volatile markets
const RESERVE_SOL = 0.05 * 1e9; // Keep 0.05 SOL for fees

export async function getAdaptiveCapital(
  connection: Connection,
  walletPubkey: PublicKey,
  priceVolatility: number
) {
  const balance = await connection.getBalance(walletPubkey);
  console.log(`💰 Wallet Balance: ${(balance / 1e9).toFixed(4)} SOL`);

  if (balance < RESERVE_SOL + 0.1 * 1e9) {
    console.warn("⚠️ Low balance, halting trading.");
    return 0;
  }

  if (priceVolatility > VOLATILITY_THRESHOLD) {
    console.log("📉 High volatility detected. Reducing capital.");
    return SAFE_CAPITAL;
  }

  console.log("✅ Stable conditions. Using default capital.");
  return DEFAULT_CAPITAL;
}
