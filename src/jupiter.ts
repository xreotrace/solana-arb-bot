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
    const data = res.data;

    if (!data || !data.outAmount || !data.inAmount) {
      console.warn(`⚠️ No valid route found for ${pair} on Jupiter.`);
      return null;
    }

    const inputDecimals = DECIMALS[base];
    const outputDecimals = DECIMALS[quote];

    const inAmount = parseFloat(data.inAmount) / Math.pow(10, inputDecimals);
    const outAmount = parseFloat(data.outAmount) / Math.pow(10, outputDecimals);

    // Direction check: if input is USDC and output is SOL, you're buying SOL → flip price
    const isBuyingSOL = base === "USDC" && quote === "SOL";

    const price = isBuyingSOL
      ? 1 / (outAmount / inAmount)
      : outAmount / inAmount;

    const ammKey = data.routePlan?.[0]?.swapInfo?.ammKey || null;

    return {
      ask: price,
      bid: price,
      inAmount: parseFloat(data.inAmount),
      inputMint,
      outputMint,
      ammKey,
    };
  } catch (err: any) {
    console.error(`Jupiter price error for ${pair}:`, err.message);
    return null;
  }
}
