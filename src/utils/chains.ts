// src/utils/chains.ts

import { TOKENS } from "./tokens";

export const CHAINS: string[][] = [
  [TOKENS.SOL, TOKENS.USDC, TOKENS.JUP, TOKENS.SOL],
  [TOKENS.SOL, TOKENS.USDT, TOKENS.JUP, TOKENS.SOL],
  [TOKENS.SOL, TOKENS.USDC, TOKENS.mSOL, TOKENS.SOL],
  // 🔥 Add more profitable loops here later easily
];
