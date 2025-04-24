export async function fetchSOLPriceUSD(): Promise<number> {
  try {
    const res = await fetch("https://price.jup.ag/v4/price?ids=SOL");
    const json = await res.json();
    return json.data.SOL.price ?? 160;
  } catch (err) {
    console.warn("⚠️ Failed to fetch SOL/USD. Defaulting to $160.");
    return 160;
  }
}
