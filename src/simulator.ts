export async function simulateTrade(
  buyFrom: string,
  sellTo: string,
  pair: string,
  buyPrice: number,
  sellPrice: number
) {
  const tradeAmount = 2; // using 2 SOL capital
  const buyCost = tradeAmount * buyPrice;
  const sellReturn = tradeAmount * sellPrice;
  const estFees = 0.002 * buyCost; // 0.2% total est. fee
  const netProfit = sellReturn - buyCost - estFees;
  const profitPercent = (netProfit / buyCost) * 100;

  console.log(
    `🧪 Simulated Trade → Buy ${tradeAmount} SOL from ${buyFrom} at ${buyPrice}`
  );
  console.log(`                     Sell on ${sellTo} at ${sellPrice}`);
  console.log(
    `                     Buy Cost: ${buyCost.toFixed(
      2
    )} | Sell Return: ${sellReturn.toFixed(2)} | Fees: ${estFees.toFixed(4)}`
  );
  console.log(
    `                     Net Profit: ${netProfit.toFixed(
      4
    )} → ${profitPercent.toFixed(2)}%\n`
  );
}
