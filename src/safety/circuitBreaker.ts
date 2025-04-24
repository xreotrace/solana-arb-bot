let failCount = 0;
const MAX_FAILS = 3;

/**
 * Call this after a failed transaction attempt.
 */
export function recordFailure(): void {
  failCount++;
  console.warn(`❌ Trade failure recorded (${failCount}/${MAX_FAILS})`);
}

/**
 * Returns true if the bot should halt based on too many failures.
 */
export function shouldHalt(): boolean {
  if (failCount >= MAX_FAILS) {
    console.error("🛑 Circuit breaker triggered: Halting operations.");
    return true;
  }
  return false;
}

/**
 * Resets failure count after a successful trade.
 */
export function resetFailures(): void {
  failCount = 0;
}
