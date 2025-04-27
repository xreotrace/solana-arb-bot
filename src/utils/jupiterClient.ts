// src/utils/jupiterClient.ts

import axios from "axios";

const JUPITER_API_URL = "https://quote-api.jup.ag/v6";

export interface QuoteParams {
  inputMint: string;
  outputMint: string;
  amount: number; // must be an integer (lamports)
  slippageBps?: number;
  enforceSingleTx?: boolean;
  onlyDirectRoutes?: boolean;
  allowIntermediateMints?: boolean;
}

// Rate limit handling
let rateLimitDelayMs = 1000; // Start with 1s delay after 429
let lastRateLimitTime = 0;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchQuote(params: QuoteParams) {
  try {
    const query: any = {
      inputMint: params.inputMint,
      outputMint: params.outputMint,
      amount: Math.floor(params.amount),
      slippageBps: params.slippageBps ?? 100,
      enforceSingleTx: params.enforceSingleTx ?? true,
      allowIntermediateMints: params.allowIntermediateMints ?? true,
      onlyDirectRoutes: params.onlyDirectRoutes ?? false,
    };

    console.log("📡 Sending quote request:", query);

    const response = await axios.get(`${JUPITER_API_URL}/quote`, {
      params: query,
    });

    // ✅ Success: Reset backoff
    rateLimitDelayMs = 1000;
    lastRateLimitTime = 0;

    return response.data;
  } catch (error: any) {
    if (error.response?.status === 429) {
      // ✅ On 429: Start exponential backoff
      rateLimitDelayMs = Math.min(rateLimitDelayMs * 2, 10000);
      lastRateLimitTime = Date.now();

      console.warn(
        "❌ Error 429: Rate limited. Backing off to",
        rateLimitDelayMs,
        "ms."
      );
      await sleep(rateLimitDelayMs); // Sleep after 429 error
    } else {
      console.error(
        "❌ Error fetching quote:",
        error.response?.data || error.message
      );
    }
    throw error;
  }
}

export async function fetchSwapTx(route: any, userPublicKey: string) {
  try {
    const response = await axios.post(`${JUPITER_API_URL}/swap`, {
      route,
      userPublicKey,
      wrapUnwrapSOL: true,
      dynamicComputeUnitLimit: true,
      prioritizeTx: true,
    });

    return response.data;
  } catch (error: any) {
    console.error(
      "❌ Error generating swap transaction:",
      error.response?.data || error.message
    );
    throw error;
  }
}

// 🛠️ Updated: Accept dynamic amount
export async function getQuote(
  inputMint: string,
  outputMint: string,
  amount: number
): Promise<any> {
  const params: QuoteParams = {
    inputMint,
    outputMint,
    amount: Math.floor(amount),
    slippageBps: 100,
    enforceSingleTx: true,
    allowIntermediateMints: true,
    onlyDirectRoutes: false,
  };
  return await fetchQuote(params);
}
