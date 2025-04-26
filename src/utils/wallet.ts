// src/utils/wallet.ts

import { Keypair, PublicKey, Connection, Transaction } from "@solana/web3.js";
import bs58 from "bs58";

const SECRET_KEY = process.env.SECRET_KEY || "hidden"; // private key string (base58)

if (!SECRET_KEY) {
  throw new Error("No wallet secret key configured!");
}

const secretKeyBytes = bs58.decode(SECRET_KEY);
const wallet = Keypair.fromSecretKey(secretKeyBytes);

export function getWalletPublicKey(): PublicKey {
  return wallet.publicKey;
}

export async function signAndSendTransaction(
  transaction: Transaction,
  connection: Connection
) {
  transaction.partialSign(wallet);
  const rawTx = transaction.serialize();
  const signature = await connection.sendRawTransaction(rawTx, {
    skipPreflight: false,
    preflightCommitment: "confirmed",
  });

  return signature;
}
