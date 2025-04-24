/**
 * Returns the recommended priority fee (in microLamports) based on current network status.
 */
export function getPriorityFee(
  networkStatus: "normal" | "busy" | "congested"
): number {
  switch (networkStatus) {
    case "normal":
      return 5000; // 0.005 SOL
    case "busy":
      return 15000; // 0.015 SOL
    case "congested":
      return 25000; // 0.025 SOL
    default:
      return 5000;
  }
}

/**
 * Classifies current network state based on transaction success rate.
 */
export function classifyNetworkLoad(
  txSuccessRate: number
): "normal" | "busy" | "congested" {
  if (txSuccessRate > 0.95) return "normal";
  if (txSuccessRate > 0.85) return "busy";
  return "congested";
}
