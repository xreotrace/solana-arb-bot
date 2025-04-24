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

export async function fetchQuote(params: QuoteParams) {
  try {
    // Build a clean query without undefined values
    const query: any = {
      inputMint: params.inputMint,
      outputMint: params.outputMint,
      amount: Math.floor(params.amount), // 🔐 Jupiter expects integer amounts
      slippageBps: params.slippageBps ?? 100,
      enforceSingleTx: params.enforceSingleTx ?? true,
      allowIntermediateMints: params.allowIntermediateMints ?? true,
      onlyDirectRoutes: params.onlyDirectRoutes ?? false,
    };

    console.log("📡 Sending quote request:", query);

    const response = await axios.get(`${JUPITER_API_URL}/quote`, {
      params: query,
    });

    return response.data;
  } catch (error: any) {
    console.error(
      "❌ Error fetching quote:",
      error.response?.data || error.message
    );
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
