interface RouteData {
  inAmount: string;
  outAmount: string;
  priceImpactPct: string;
}

/**
 * Validates a route's profit and price impact.
 * Rejects if:
 * - Estimated profit < minProfitUSDC
 * - Price impact > 5%
 */
export function validateRoute(route: RouteData, minProfitUSDC = 0.01): boolean {
  const inAmount = parseFloat(route.inAmount) / 1e9; // SOL
  const outAmount = parseFloat(route.outAmount) / 1e6; // USDC
  const priceImpact = parseFloat(route.priceImpactPct); // %

  const profit = outAmount - inAmount;

  console.log(
    `📊 Validation: in=${inAmount.toFixed(3)} out=${outAmount.toFixed(
      3
    )} profit=${profit.toFixed(4)} impact=${priceImpact}%`
  );

  if (profit < minProfitUSDC) {
    console.warn("⚠️ Trade rejected: Profit below threshold");
    return false;
  }

  if (priceImpact > 5) {
    console.warn("⚠️ Trade rejected: High price impact");
    return false;
  }

  return true;
}
