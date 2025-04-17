import axios from "axios";

const MINTS: Record<string, string> = {
  SOL: "So11111111111111111111111111111111111111112",
  USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  USDT: "Es9vMFrzaCERtFzFb4J1Kz5wPYnnYtLKQzWjjL2oEtkM",
};

const DECIMALS: Record<string, number> = {
  SOL: 9,
  USDC: 6,
  USDT: 6,
};

const TRADE_SIZE: Record<string, number> = {
  SOL: 2, // 2 SOL
  USDC: 20, // 20 USDC
  USDT: 20, // 20 USDT
};

export async function getJupiterPrice(pair: string) {
  try {
    const [base, quote] = pair.split("/");

    const inputMint = MINTS[base];
    const outputMint = MINTS[quote];

    const baseDecimals = DECIMALS[base];
    const amount = TRADE_SIZE[base] * 10 ** baseDecimals;

    const url = `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=50&onlyDirectRoutes=true`;

    const res = await axios.get(url);
    const route = res.data?.data?.[0];

    if (!route || !route.outAmountWithSlippage) {
      console.warn(`⚠️ No valid route found for ${pair} on Jupiter.`);
      return null;
    }

    const inputAmount = amount / 10 ** baseDecimals;
    const outAmount = parseFloat(route.outAmountWithSlippage) / 1e6;

    const bid = outAmount / inputAmount;
    const ask = inputAmount / outAmount;

    return {
      bid,
      ask,
      inAmount: amount,
      inputMint,
      outputMint,
    };
  } catch (err: any) {
    console.error(`Jupiter price error for ${pair}:`, err.message);
    return null;
  }
}
