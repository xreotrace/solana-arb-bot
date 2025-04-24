// This file not needed for now, but kept for future reference

/* import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";

import {
  Connection,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
  Keypair,
} from "@solana/web3.js";

/**
 * Ensures your wallet has an Associated Token Account (ATA) for a given mint.
 * Creates one if it doesn't exist.
 *
 * @param connection - Solana RPC connection
 * @param owner - Your wallet public key
 * @param mint - Token mint address (e.g., USDC)
 * @param payer - The signer (usually same as owner)
 */
/* export async function ensureATA(
  connection: Connection,
  owner: PublicKey,
  mint: PublicKey,
  payer: Keypair
): Promise<PublicKey> {
  const ata = await getAssociatedTokenAddress(mint, owner);
  const accountInfo = await connection.getAccountInfo(ata);

  if (accountInfo !== null) {
    console.log(`✅ ATA already exists for ${mint.toBase58()}`);
    return ata;
  }

  console.log(`➕ Creating ATA for ${mint.toBase58()}...`);
  const tx = new Transaction().add(
    createAssociatedTokenAccountInstruction(payer.publicKey, ata, owner, mint)
  );

  const sig = await sendAndConfirmTransaction(connection, tx, [payer]);
  console.log(`🎯 ATA created successfully. TX: ${sig}`);
  return ata;
} */
