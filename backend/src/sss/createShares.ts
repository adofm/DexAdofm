/**
 * Generates shares of a private key using Shamir's Secret Sharing and saves them into an `.env` file.
 * 
 * This function splits a given private key into a specified number of shares with a threshold requirement. 
 * The shares are then stored in an `.env` file, each tagged with a unique identifier.
 * 
 * @param privateKey - The private key to be split into shares.
 */
// @ts-ignore
import sss from "shamirs-secret-sharing";
import { SHARES, THRESHOLD } from "../config";
import fs from "fs";
/**
 * Call this function to generate an env file which will have all shares
 */
export function createShares(privateKey: string) {
  // Convert the private key to a Buffer for compatibility with the Shamir's Secret Sharing library.
  const secret = Buffer.from(privateKey);
  let data = "";

  // Generate shares from the private key using the specified number of shares and threshold.
  const shares = sss.split(secret, { shares: SHARES, threshold: THRESHOLD });

  // Iterate over the shares and prepare them in the `.env` file format.
  shares.forEach((share: Buffer, index: number) => {
    const number = index + 1; // Assign a share number starting from 1.
    const shareString = new Uint8Array(share).toString(); // Convert the share to a string representation.
    data = data.concat(`# SHARE_${number} \nSHARE="${shareString}" \n`); // Append share details to the output.
  });

  // Write the generated shares to an `.env` file located in the specified path.
  fs.writeFileSync("./src/sss/.env", data);
}

// Example usage: Uncomment the below line to generate shares for a private key.
// Replace "your-private-key-here" with the actual private key to be split.
// createShares("your-private-key-here");
