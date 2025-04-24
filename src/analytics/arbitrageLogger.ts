import fs from "fs";
import path from "path";
import { parse } from "json2csv";

const FILE_PATH = path.join(__dirname, "../../logs/arbitrages.csv");

const headers = [
  "timestamp",
  "chain",
  "inAmountSOL",
  "outAmountSOL",
  "profitSOL",
  "profitUSD",
];

export function logArbitrage(data: {
  timestamp: string;
  chain: string[];
  inAmountSOL: number;
  outAmountSOL: number;
  profitSOL: number;
  profitUSD: number;
}) {
  const exists = fs.existsSync(FILE_PATH);

  const row = {
    timestamp: data.timestamp,
    chain: data.chain.join(" → "),
    inAmountSOL: data.inAmountSOL,
    outAmountSOL: data.outAmountSOL,
    profitSOL: data.profitSOL.toFixed(6),
    profitUSD: data.profitUSD.toFixed(6),
  };

  const csv = parse([row], { header: !exists });

  fs.appendFileSync(FILE_PATH, (exists ? "\n" : "") + csv);
  console.log("🟢 Arbitrage logged:", row);
}
