export async function fetchSOLPriceUSD(): Promise<number> {
  // Try Jupiter first
  try {
    const res = await fetch("https://price.jup.ag/v4/price?ids=SOL", {
      headers: {
        "User-Agent": "solana-arb-bot/1.0 (+https://yourdomain.com)",
        Accept: "application/json",
      },
    });
    const json = await res.json();
    const price = json.data?.SOL?.price;
    if (price) {
      return price;
    }
    console.warn("⚠️ Jupiter API returned invalid data. Trying CoinGecko...");
  } catch (err) {
    console.warn("⚠️ Jupiter price fetch failed. Trying CoinGecko...");
  }

  // Fallback: CoinGecko
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd",
      {
        headers: {
          Accept: "application/json",
        },
      }
    );
    const json = await res.json();
    const price = json.solana?.usd;
    if (price) {
      return price;
    }
    console.warn("⚠️ CoinGecko API returned invalid data. Defaulting...");
  } catch (err) {
    console.warn("⚠️ CoinGecko price fetch failed. Defaulting...");
  }

  // Final fallback
  return 160;
}
