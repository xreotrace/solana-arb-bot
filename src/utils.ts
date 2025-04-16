export function calculateProfitPercent(
  buyPrice: number,
  sellPrice: number
): number {
  return ((sellPrice - buyPrice) / buyPrice) * 100;
}
