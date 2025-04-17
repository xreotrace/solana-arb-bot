import axios from "axios";

export async function checkRaydiumPrice(pair: string) {
  try {
    const [base, quote] = pair.split("/");

    const url = `https://quote-api.jup.ag/v6/quote?inputMint=${getMint(
      base
    )}&outputMint=${getMint(quote)}&amount=1000000&onlyDirectRoutes=true`;

    const res = await axios.get(url);

    console.log(
      `Raydium API response for ${pair}:`,
      JSON.stringify(res.data, null, 2)
    );

    if (!res.data || !res.data.outAmount) {
      console.log(`⚠️ No valid route found for ${pair} on Raydium.`);
      return null;
    }

    const outAmount = Number(res.data.outAmount);
    return {
      bid: outAmount / 1e6,
      ask: 1e6 / outAmount,
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
  return mints[symbol] || "";
}
