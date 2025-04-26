// src/utils/chainGenerator.ts

import { TOKENS } from "./tokens";

// Assign priority to tokens
const tokenPriorityList = [
  TOKENS.USDC, // 🥇 Highest liquidity
  TOKENS.USDT, // 🥈
  TOKENS.mSOL, // 🥉
  TOKENS.JUP, // 🥉 Medium
  // Add more tokens in priority order if you want
];

export function generateSmartChains(tradeAmountSOL: number): string[][] {
  const chains: string[][] = [];

  let maxHops = 2;

  if (tradeAmountSOL >= 10) {
    maxHops = 3;
  }

  console.log(
    `🛠️ Generating chains (max ${maxHops} hops) for trade size ${tradeAmountSOL} SOL with liquidity priority.`
  );

  for (const token1 of tokenPriorityList) {
    chains.push([TOKENS.SOL, token1, TOKENS.SOL]); // 1-hop always

    if (maxHops >= 2) {
      for (const token2 of tokenPriorityList) {
        if (token2 !== token1) {
          chains.push([TOKENS.SOL, token1, token2, TOKENS.SOL]);
        }
      }
    }

    if (maxHops >= 3) {
      for (const token2 of tokenPriorityList) {
        for (const token3 of tokenPriorityList) {
          if (token3 !== token2 && token3 !== token1) {
            chains.push([TOKENS.SOL, token1, token2, token3, TOKENS.SOL]);
          }
        }
      }
    }
  }

  return chains;
}
