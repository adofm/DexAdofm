
/**
 * Recover the private key using Shamir's Secret Sharing scheme.
 * 
 * @param sharesArray - An array of shares (Uint8Array or number[]).
 * @returns The recovered Keypair object.
 * @throws Error if the number of shares is below the required threshold or if recovery fails.
 */
// @ts-ignore
import sss from "shamirs-secret-sharing";
import { DISTRIBUTED_SERVER_ENDPOINTS, THRESHOLD } from "../config";
import { Keypair } from "@solana/web3.js";
import { decode } from "bs58";
import axios from "axios";

/**
 * Call this function by sending atleast 3 shares to get back private key
 */
export function recoverPrivateKey(sharesArray: Array<Uint8Array | number[]>) {
  // Ensure the provided shares meet the required threshold.
  if (!sharesArray || sharesArray.length < THRESHOLD) {
    throw new Error("Minimum threshold required");
  }
  try {
     // Combine the shares to recover the secret.
    const recovered = sss.combine(sharesArray);
     // Decode the recovered secret and generate a Keypair.
    const keypair = Keypair.fromSecretKey(decode(recovered.toString()));
    return keypair;
  } catch (error) {
    // Handle errors during the recovery process.
    throw new Error(
      "Could not recover the private key, send a valid uint8 array"
    );
  }
}
/**
 * Fetch shares from distributed servers and return them as an array.
 * 
 * @returns A promise resolving to an array of shares (number[]).
 */
export async function fetchShares() {
  // Send parallel requests to fetch shares from all distributed server endpoints.
  const sharesArray = [] as Array<number[]>;
  const requests = DISTRIBUTED_SERVER_ENDPOINTS.map((endpoint) =>
    axios
      .get(`${endpoint}/share`)
      .then((res) => {
        const share = res.data.share as string;
        if (share) {
          const shareArray = share.split(",").map(Number);
          sharesArray.push(shareArray);
        }
      })
      .catch((err) => console.log(err.message))
  );

  const a = await Promise.all(requests).then(() => {
    return sharesArray;
  });
  return a;
}
