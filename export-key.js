const fs = require("fs");
const bs58 = require("bs58");

// Load the full secret key array from id.json
const keypair = JSON.parse(
  fs.readFileSync(
    "C:/Users/mdmar/solana-arb-bot/~/.config/solana/id.json",
    "utf-8"
  )
);

// Convert to base58
const base58SecretKey = bs58.encode(Uint8Array.from(keypair));

console.log("✅ Full Base58 PRIVATE_KEY for .env:");
console.log(base58SecretKey);
