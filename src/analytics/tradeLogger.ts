import fs from "fs";
import path from "path";

const logFile = path.join(__dirname, "../../logs/trades.csv");

export function logTrade({
  timestamp,
  inputMint,
  outputMint,
  inAmount,
  outAmount,
  profit,
}: {
  timestamp: string;
  inputMint: string;
  outputMint: string;
  inAmount: number;
  outAmount: number;
  profit: number;
}) {
  const logLine = `${timestamp},${inputMint},${outputMint},${inAmount},${outAmount},${profit.toFixed(
    6
  )}\n`;

  if (!fs.existsSync(logFile)) {
    fs.mkdirSync(path.dirname(logFile), { recursive: true });
    fs.writeFileSync(
      logFile,
      "timestamp,inputMint,outputMint,inAmount,outAmount,profit\n"
    );
  }

  fs.appendFileSync(logFile, logLine);
  console.log("📝 Trade logged to trades.csv");
}
