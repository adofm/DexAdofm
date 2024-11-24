import { PrismaClient } from "@prisma/client";

const prismaClient = new PrismaClient();

/**
 * Fetches the next task for a specific worker that has not been completed and has no prior submissions by the worker.
 *
 * @param userId - The ID of the worker requesting the next task.
 * @returns The next task object containing task details such as ID, amount, title, and options, 
 *          or null if no eligible tasks are found.
 */

export const getNextTask = async (userId: number) => {
    // Query the database for a task that:
    // 1. Is not marked as done (`done: false`).
    // 2. Has no submissions associated with the given worker (`submissions.none`).
    const task = await prismaClient.task.findFirst({
        where: {
            done: false, // Task should not be completed.
            submissions: {
                none: {
                    worker_id: userId // Ensure the worker has not submitted this task.
                }
            }
        },
        select: {
            id: true, // Include the task ID in the result.
            amount: true, // Include the task amount in the result.
            title: true, // Include the task title in the result.
            options: true // Include task options in the result.
        }
    });

    // Return the task object or null if no eligible task is found.
    return task;
};
