let tradeCapital = 1.95 * 1e9; // Start at 1.95 SOL (in lamports)

const COMPOUND_THRESHOLD = 0.05; // Every 0.05 SOL profit triggers compounding
const COMPOUND_INCREMENT = 0.05 * 1e9; // Increase capital by 0.05 SOL
const MAX_CAPITAL = 2.2 * 1e9; // Cap at 2.2 SOL
const AUTO_STOP_LIMIT = 3 * 1e9; // Stop if capital exceeds 3 SOL

/**
 * Returns updated capital after checking if currentProfit meets threshold.
 */
export function updateTradeCapital(currentProfitSOL: number): number {
  if (currentProfitSOL < COMPOUND_THRESHOLD) return tradeCapital;

  if (tradeCapital + COMPOUND_INCREMENT <= MAX_CAPITAL) {
    tradeCapital += COMPOUND_INCREMENT;
    console.log(
      `📈 Auto-Compounding: Increased trade capital to ${(
        tradeCapital / 1e9
      ).toFixed(3)} SOL`
    );
  }

  if (tradeCapital >= AUTO_STOP_LIMIT) {
    console.warn("🛑 Auto-stop triggered: Capital exceeds safety limit.");
    return 0;
  }

  return tradeCapital;
}

/**
 * Returns the current capital to be used for trading.
 */
export function getTradeCapital(): number {
  return tradeCapital;
}
