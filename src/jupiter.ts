import axios from "axios";

const MINTS: Record<string, string> = {
  SOL: "So11111111111111111111111111111111111111112",
  USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
};

const DECIMALS: Record<string, number> = {
  SOL: 9,
  USDC: 6,
};

export async function getJupiterPrice(pair: string, amountLamports: number) {
  try {
    const [base, quote] = pair.split("/");
    const inputMint = MINTS[base];
    const outputMint = MINTS[quote];

    const url = `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amountLamports}&slippageBps=50&onlyDirectRoutes=true`;

    const res = await axios.get(url);
    const route = res.data;

    if (!route || !route.outAmount) {
      console.warn(`⚠️ No valid route found for ${pair} on Jupiter.`);
      return null;
    }

    const inputAmount = amountLamports / 1e9;
    const outAmount = parseFloat(route.outAmount) / 1e6;

    const bid = outAmount / inputAmount;
    const ask = inputAmount / outAmount;

    return {
      bid,
      ask,
      inAmount: amountLamports,
      inputMint,
      outputMint,
    };
  } catch (err: any) {
    console.error(`Jupiter price error for ${pair}:`, err.message);
    return null;
  }
}
