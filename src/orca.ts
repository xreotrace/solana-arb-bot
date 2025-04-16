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

    return {
      bid: quote.getMinOutputAmount().toNumber(), // already normalized
      ask: 1 / quote.getMinOutputAmount().toNumber(),
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
      throw new Error(`Unsupported pool: ${pair}`);
  }
}
