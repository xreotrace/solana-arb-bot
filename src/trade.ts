import {
  Connection,
  Keypair,
  PublicKey,
  VersionedTransaction,
} from "@solana/web3.js";
import base58 from "bs58";
import fetch from "node-fetch";
import Decimal from "decimal.js"; // ✅ Add this line
import { getOrca, OrcaPoolConfig, Network } from "@orca-so/sdk";

const RPC_URL = process.env.RPC_URL || "https://api.mainnet-beta.solana.com";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const connection = new Connection(RPC_URL, "confirmed");

let wallet: Keypair;
try {
  wallet = Keypair.fromSecretKey(base58.decode(PRIVATE_KEY));
} catch (e) {
  console.error("❌ Failed to load wallet from PRIVATE_KEY");
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

  if (buyFrom === "Raydium") {
    console.log(`🚨 Executing swap on Raydium (via Jupiter)`);

    const inputMint =
      base === "SOL"
        ? "So11111111111111111111111111111111111111112"
        : "unknown";

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
    const routeData = await routeRes.json();
    if (!routeData.data || !routeData.data[0]) {
      console.log("❌ No route found");
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
    const swapTx = VersionedTransaction.deserialize(
      Buffer.from(txJson.swapTransaction, "base64")
    );
    swapTx.sign([wallet]);

    const sig = await connection.sendTransaction(swapTx);
    console.log(`✅ Raydium swap sent! Tx: https://solscan.io/tx/${sig}`);
  } else if (buyFrom === "Orca") {
    console.log(`🚨 Executing swap on Orca (via SDK)`);

    const orca = getOrca(connection, Network.MAINNET);
    const pool =
      pair === "SOL/USDC"
        ? orca.getPool(OrcaPoolConfig.SOL_USDC)
        : pair === "SOL/USDT"
        ? orca.getPool(OrcaPoolConfig.SOL_USDT)
        : null;

    if (!pool) {
      console.log(`⚠️ Orca pool not found for ${pair}`);
      return;
    }

    const solToken = pool.getTokenA();

    const amountIn = new Decimal(amountSOL);
    const quote = await pool.getQuote(solToken, amountIn);
    const minOutput = quote.getMinOutputAmount(); // ✅ Get minimum acceptable output

    const swapPayload = await pool.swap(wallet, solToken, amountIn, minOutput);
    const sig = await swapPayload.execute();
    console.log(`✅ Orca swap sent! Tx: https://solscan.io/tx/${sig}`);
  } else {
    console.log(`❌ Unsupported swap route: ${buyFrom}`);
  }
}
