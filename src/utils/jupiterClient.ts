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

let rateLimitDelayMs = 1000; // Initial backoff delay (1 second)
let lastRequestTime = 0;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchQuote(params: QuoteParams) {
  const now = Date.now();
  const waitTime = Math.max(0, rateLimitDelayMs - (now - lastRequestTime));
  if (waitTime > 0) {
    await sleep(waitTime);
  }

  try {
    lastRequestTime = Date.now();

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

    rateLimitDelayMs = 1000; // Reset backoff on success
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 429) {
      rateLimitDelayMs = Math.min(rateLimitDelayMs * 2, 10000);
      console.warn(
        "❌ Error 429: Rate limited. Backing off to",
        rateLimitDelayMs,
        "ms."
      );
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

// 🛠️ Updated: Accept amount dynamically
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
