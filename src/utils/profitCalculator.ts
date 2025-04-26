// src/utils/profitCalculator.ts

const DEFAULT_GAS_COST_SOL = 0.00002; // Estimated gas cost per swap

export function calculateNetProfit(quote: any, gasSwaps: number = 1): number {
  const inputAmountSOL = quote.inAmount / 1e9; // lamports to SOL
  const outputAmountSOL = quote.outAmount / 1e9;
  const estimatedGasCost = gasSwaps * DEFAULT_GAS_COST_SOL;

  const netProfit = outputAmountSOL - inputAmountSOL - estimatedGasCost;

  return netProfit;
}
