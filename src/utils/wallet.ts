// src/utils/wallet.ts

import { Keypair, PublicKey, Connection, Transaction } from "@solana/web3.js";
import bs58 from "bs58";

// Load secret key securely from environment variables
const SECRET_KEY = process.env.SECRET_KEY;

if (!SECRET_KEY) {
  throw new Error("❌ No wallet secret key configured in .env!");
}

// Decode secret key from base58 format
const secretKeyBytes = bs58.decode(SECRET_KEY);
const wallet = Keypair.fromSecretKey(secretKeyBytes);

/**
 * Get the public key of the loaded wallet
 */
export function getWalletPublicKey(): PublicKey {
  return wallet.publicKey;
}

/**
 * Sign and send a transaction using the loaded wallet
 */
export async function signAndSendTransaction(
  transaction: Transaction,
  connection: Connection
): Promise<string> {
  transaction.partialSign(wallet);
  const rawTx = transaction.serialize();
  const signature = await connection.sendRawTransaction(rawTx, {
    skipPreflight: false,
    preflightCommitment: "confirmed",
  });

  return signature;
}
