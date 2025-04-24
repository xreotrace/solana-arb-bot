import dotenv from "dotenv";
dotenv.config();

import { runArbitrage } from "./core/arbitrage";
import { Command } from "commander";
import { generateSummary } from "./analytics/summaryReport";
import { startScannerLoop } from "./loop/scanLoop";
import { findBestMultiHopRoute } from "./logic/multiHopRouter";

const program = new Command();

program
  .name("solana-arb-bot")
  .description("Command-line interface for Solana Arbitrage Bot")
  .version("1.0.0");

program
  .command("run")
  .description("Run arbitrage loop once")
  .action(() => {
    runArbitrage();
  });

program
  .command("summary")
  .description("Print trade summary over past hours")
  .option("-h, --hours <number>", "Number of hours to analyze", "12")
  .action((opts) => {
    const hours = parseInt(opts.hours);
    generateSummary(hours);
  });

program
  .command("scan")
  .description("Run continuous opportunity scanner")
  .action(() => {
    startScannerLoop();
  });

program
  .command("multihop")
  .description("Run multi-hop arbitrage scanner")
  .action(findBestMultiHopRoute);

program.parse();
