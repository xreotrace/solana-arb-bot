import fs from "fs";
import path from "path";

const logFile = path.join(__dirname, "../../logs/trades.csv");

export function generateSummary(hours = 12): void {
  if (!fs.existsSync(logFile)) {
    console.warn("⚠️ No trade logs found.");
    return;
  }

  const now = Date.now();
  const data = fs.readFileSync(logFile, "utf-8").split("\n").slice(1); // skip CSV header
  let totalProfit = 0;
  let count = 0;

  for (const row of data) {
    if (!row.trim()) continue;
    const [timestamp, , , , , profit] = row.split(",");
    const age = now - new Date(timestamp).getTime();
    if (age <= hours * 60 * 60 * 1000) {
      totalProfit += parseFloat(profit);
      count++;
    }
  }

  console.log(`📊 Summary Report (last ${hours}h):`);
  console.log(`Trades executed: ${count}`);
  console.log(`Total profit: ${totalProfit.toFixed(4)} USDC`);
  console.log(
    `Avg profit/trade: ${(totalProfit / count || 0).toFixed(4)} USDC`
  );
}
