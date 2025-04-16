import axios from "axios";

export async function checkRaydiumPrice(pair: string) {
  try {
    const [base, quote] = pair.split("/");
    const url = `https://quote-api.jup.ag/v6/quote?inputMint=${getMint(
      base
    )}&outputMint=${getMint(quote)}&amount=1000000&onlyDirectRoutes=true`;
    const res = await axios.get(url);
    const route = res.data.data[0];
    return {
      bid: route.outAmount / 1e6,
      ask: 1e6 / route.outAmount,
    };
  } catch (err) {
    console.error(`Raydium price error for ${pair}:`, err.message);
    return null;
  }
}

function getMint(symbol: string): string {
  const mints: Record<string, string> = {
    SOL: "So11111111111111111111111111111111111111112",
    USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    USDT: "Es9vMFrzaCERtFzFb4J1Kz5wPYnnYtLKQzWjjL2oEtkM",
  };
  return mints[symbol];
}
