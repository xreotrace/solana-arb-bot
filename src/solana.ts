import { Connection, PublicKey } from "@solana/web3.js";

export async function getSolBalance(
  connection: Connection,
  publicKey: PublicKey
): Promise<number> {
  const lamports = await connection.getBalance(publicKey);
  return lamports / 1e9; // Convert to SOL
}
