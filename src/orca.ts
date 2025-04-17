import { getOrca, OrcaPoolConfig, Network } from "@orca-so/sdk";
import Decimal from "decimal.js";
import { Connection } from "@solana/web3.js";

const connection = new Connection(process.env.RPC_URL || "", "confirmed");
const orca = getOrca(connection, Network.MAINNET);

export async function checkOrcaPrice(pair: string) {
  try {
    const pool = getPool(pair);
    const quote = await pool.getQuote(
      pool.getTokenA(),
      new Decimal("1.0"), // 1 token (converted to smallest unit internally)
      new Decimal("0.01") // 1% slippage
    );

    const minOutputAmount = quote.getMinOutputAmount().toNumber();
    if (minOutputAmount <= 0) {
      console.log(
        `⚠️ Invalid quote for ${pair} on Orca. Min output amount is 0 or less.`
      );
      return null;
    }

    return {
      bid: minOutputAmount, // Already normalized
      ask: 1 / minOutputAmount, // The ask price is the inverse of the bid
    };
  } catch (err: any) {
    console.error(`Orca price error for ${pair}:`, err.message);
    return null;
  }
}

function getPool(pair: string) {
  switch (pair) {
    case "SOL/USDC":
      return orca.getPool(OrcaPoolConfig.SOL_USDC);
    case "SOL/USDT":
      return orca.getPool(OrcaPoolConfig.SOL_USDT);
    default:
      console.error(`❌ Unsupported pool: ${pair}`);
      throw new Error(`Unsupported pool: ${pair}`);
  }
}
