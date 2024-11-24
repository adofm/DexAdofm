import { PrismaClient } from "@prisma/client"; // Import PrismaClient for database interactions
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js"; // Import Solana libraries for blockchain transactions
import { DoneCallback, Job } from "bull"; // Import Bull.js for job processing
import { PARENT_WALLET_PUBLIC_KEY } from "../config"; // Import parent wallet public key from the configuration file
import { RPC_URL, SWEEPER_WORKER_ENDPOINT, TOTAL_DECIMALS } from "../config"; // Import RPC URL, worker endpoint, and decimal constant
import { fetchShares, recoverPrivateKey } from "../sss"; // Import utility functions for private key recovery
import axios from "axios"; // Import Axios for HTTP requests

// Initialize Prisma client for database interaction
const prismaClient = new PrismaClient();
// Establish connection to the Solana blockchain
const connection = new Connection(RPC_URL);

/**
 * Processes a job from the queue to perform worker payouts.
 * This involves transferring lamports to the worker's wallet
 * and updating the database to reflect the payout.
 *
 * @param job - The job containing worker data
 * @param done - Callback to signal job completion
 */
export const process_Queue = async (job: Job, done: DoneCallback) => {
  // Extract worker ID from job data
  const { workerId } = job.data as {
    workerId: number;
  };

  console.log("\n\nInitializing Transaction");

  // Begin a transaction to ensure atomicity of database updates
  await prismaClient.$transaction(async (tx) => {
    // Fetch the worker details from the database
    const worker = await tx.worker.findUnique({
      where: { id: workerId },
    });

    let signature: string; // Variable to store transaction signature

    try {
      // Validate if worker and parent wallet public key exist
      if (!worker) {
        throw new Error("Worker Not Found");
      }
      if (!PARENT_WALLET_PUBLIC_KEY) {
        throw new Error("Set parent public key");
      }

      // Create a Solana transfer transaction
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: new PublicKey(PARENT_WALLET_PUBLIC_KEY), // Sender's public key
          toPubkey: new PublicKey(worker.address), // Recipient's public key
          lamports: (1000_000_000 * worker.locked_amount) / TOTAL_DECIMALS, // Amount to transfer
        })
      );

      // Recover the private key from shares
      const keypair = recoverPrivateKey(await fetchShares());

      // Send the transaction to the Solana blockchain
      signature = await connection.sendTransaction(transaction, [keypair], {
        preflightCommitment: "confirmed",
        skipPreflight: false,
      });

      console.log(
        `User ${workerId} was payed, ${
          (1000_000_000 * worker.locked_amount) / TOTAL_DECIMALS
        } lamports, signature: ${signature}`
      );
    } catch (error) {
      // Log any errors that occur during the process
      console.log((error as Error).message);
      return;
    }

    // Update the worker's locked amount in the database
    await tx.worker.update({
      where: { id: workerId },
      data: { locked_amount: { decrement: worker.locked_amount } },
    });

    // Record the payout in the payouts table
    await tx.payouts.create({
      data: {
        worker_id: workerId, // ID of the worker receiving the payout
        amount: worker.locked_amount, // Amount paid
        status: "Success", // Status of the payout
        signature: signature, // Blockchain transaction signature
      },
    });

    console.log(
      "Worker's locked amount and payout is cleared, Transaction Successful.\n\n"
    );
  });
};
