import {
  Connection,
  Keypair,
  PublicKey,
  VersionedTransaction,
} from "@solana/web3.js";
import * as bs58 from "bs58";
import fetch from "node-fetch";
import Decimal from "decimal.js";

const RPC_URL = process.env.RPC_URL || "https://api.mainnet-beta.solana.com";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const connection = new Connection(RPC_URL, "confirmed");

let wallet: Keypair;
try {
  const decoded = bs58.decode(PRIVATE_KEY);
  if (decoded.length !== 64) {
    throw new Error(
      `Invalid secret key length: ${decoded.length}. Expected 64 bytes.`
    );
  }
  wallet = Keypair.fromSecretKey(decoded);
  console.log("✅ Wallet loaded successfully:", wallet.publicKey.toBase58());
} catch (e) {
  console.error("❌ Failed to load wallet from PRIVATE_KEY\n", e);
  process.exit(1);
}

export async function tryRealTrade(
  buyFrom: string,
  sellTo: string,
  pair: string,
  buyPrice: number,
  sellPrice: number
) {
  const [base, quote] = pair.split("/");
  const amountSOL = 2;
  const amountLamports = amountSOL * 1e9;

  console.log(`🚨 Executing swap via Jupiter (buyFrom=${buyFrom})`);

  const inputMint =
    base === "SOL" ? "So11111111111111111111111111111111111111112" : "unknown";

  const outputMint =
    quote === "USDC"
      ? "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
      : quote === "USDT"
      ? "Es9vMFrzaCERaGk8jGhrwz5NzfkaEZk51wS8fovcErK"
      : "unknown";

  if (inputMint === "unknown" || outputMint === "unknown") {
    console.log(`⚠️ Unsupported token pair: ${pair}`);
    return;
  }

  const routeUrl = `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amountLamports}&slippage=0.5`;

  const routeRes = await fetch(routeUrl);

  if (!routeRes.ok) {
    const errorText = await routeRes.text();
    console.log(`❌ Jupiter error: ${routeRes.status} ${routeRes.statusText}`);
    console.log("🪵 Full response:", errorText);
    return;
  }

  const routeData = await routeRes.json();

  if (
    !routeData.data ||
    !Array.isArray(routeData.data) ||
    routeData.data.length === 0
  ) {
    console.log("❌ No valid swap route returned from Jupiter for", pair);
    return;
  }

  const route = routeData.data[0];

  const txRes = await fetch("https://quote-api.jup.ag/v6/swap", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userPublicKey: wallet.publicKey.toBase58(),
      route,
      wrapUnwrapSOL: true,
      feeAccount: null,
    }),
  });

  const txJson = await txRes.json();

  if (!txJson.swapTransaction) {
    console.log("❌ Jupiter swap failed to return a transaction.");
    return;
  }

  const swapTx = VersionedTransaction.deserialize(
    Buffer.from(txJson.swapTransaction, "base64")
  );
  swapTx.sign([wallet]);

  const sig = await connection.sendTransaction(swapTx);
  console.log(`✅ Swap sent! Tx: https://solscan.io/tx/${sig}`);
}
