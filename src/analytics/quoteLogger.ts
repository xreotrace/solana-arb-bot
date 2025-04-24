import fs from "fs";
import path from "path";

const logFile = path.join(__dirname, "../../logs/quotes.csv");

interface QuoteLog {
  timestamp: string;
  inputMint: string;
  outputMint: string;
  inAmount: number;
  outAmount: number;
  profit: number;
  reason: string;
}

export function logQuote({
  timestamp,
  inputMint,
  outputMint,
  inAmount,
  outAmount,
  profit,
  reason,
}: QuoteLog) {
  const logLine = `${timestamp},${inputMint},${outputMint},${inAmount},${outAmount},${profit.toFixed(
    6
  )},${reason}\n`;

  if (!fs.existsSync(logFile)) {
    fs.mkdirSync(path.dirname(logFile), { recursive: true });
    fs.writeFileSync(
      logFile,
      "timestamp,inputMint,outputMint,inAmount,outAmount,profit,reason\n"
    );
  }

  fs.appendFileSync(logFile, logLine);
  console.log(`📒 Quote logged: ${reason}`);
}
