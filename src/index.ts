import dotenv from "dotenv";
dotenv.config();

import { Command } from "commander";
import { runArbitrage } from "./core/arbitrage";
import { generateSummary } from "./analytics/summaryReport";
import { startScannerLoop } from "./loop/scanLoop";
import { findBestMultiHopRoute } from "./logic/multiHopRouter";
import { startLiveScanner } from "./logic/liveScanner";

const program = new Command();

program
  .name("solana-arb-bot")
  .description("Command-line interface for Solana Arbitrage Bot")
  .version("1.0.0");

program
  .command("run")
  .description("Run arbitrage logic once")
  .action(async () => {
    await runArbitrage();
  });

program
  .command("summary")
  .description("Print trade summary over past hours")
  .option("-h, --hours <number>", "Number of hours to analyze", "12")
  .action(async (opts) => {
    const hours = parseInt(opts.hours, 10);
    await generateSummary(hours);
  });

program
  .command("scan")
  .description("Run continuous opportunity scanner")
  .action(() => {
    startScannerLoop(); // already internally handles async
  });

program
  .command("multihop")
  .description("Run multi-hop arbitrage scanner")
  .action(async () => {
    await findBestMultiHopRoute();
  });

program
  .command("livescan")
  .description("Start live multi-hop scanner loop")
  .action(() => {
    startLiveScanner();
  });

program.parse();
