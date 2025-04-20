export function calculateProfitPercent(buyPrice: number, sellPrice: number) {
  const profit = sellPrice - buyPrice;
  return (profit / buyPrice) * 100;
}
