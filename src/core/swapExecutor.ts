// src/core/swapExecutor.ts

import { fetchSwapTx } from "../utils/jupiterClient";
import { getWalletPublicKey, signAndSendTransaction } from "../utils/wallet"; // you must have a wallet helper
import { Connection, Transaction } from "@solana/web3.js"; // assuming you use solana/web3.js

const RPC_ENDPOINT =
  process.env.RPC_ENDPOINT || "https://api.mainnet-beta.solana.com"; // adjust if needed
const connection = new Connection(RPC_ENDPOINT, "confirmed");

export async function executeTrade(routeData: any) {
  console.log("🚀 Executing real trade...");

  try {
    const userPublicKey = getWalletPublicKey();

    const swapPayload = await fetchSwapTx(routeData, userPublicKey.toString());

    if (!swapPayload?.swapTransaction) {
      console.error("❌ Swap transaction payload missing or invalid!");
      return null;
    }

    const swapTx = Buffer.from(swapPayload.swapTransaction, "base64");
    const transaction = Transaction.from(swapTx);

    const signature = await signAndSendTransaction(transaction, connection);

    console.log("✅ Trade successfully sent! Tx Signature:", signature);

    return signature;
  } catch (err: any) {
    console.error("❌ Trade execution failed:", err.message);
    return null;
  }
}
