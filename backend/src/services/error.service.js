import pool from "../config/db.js";
import {
  insertError,
  findExistingError,
  getAllErrors,
  incrementOccurrence,
} from "../repositries/error.repository.js";
import insertOutboxEvent from "../repositries/outbox.repository.js";
import generateHash from "../utils/hash.utils.js";
import { getIO } from "../config/socket.js";

const createErrorService = async ({ error, stack, service, projectId }) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const errorHash = generateHash(error, stack);

    // CHECK EXISTING ERROR
    const existingError = await findExistingError(errorHash, projectId, client);

    // IF EXISTS → INCREMENT COUNT
    if (existingError) {
      const updatedError = await incrementOccurrence(existingError.id, client);

      await client.query("COMMIT");

      // REALTIME EVENT
      const io = getIO();

      io.emit("error_updated", updatedError);

      return updatedError;
    }

    const newError = await insertError(
      {
        error,
        stack,
        service,
        errorHash,
        projectId,
      },
      client,
    );

    await insertOutboxEvent(newError.id, client);
    await client.query("COMMIT");

    // REALTIME EVENT
    const io = getIO();

    io.emit("new_error", newError);

    return newError;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

const getAllErrorsService = async () => {
  const errors = await getAllErrors();
  return errors;
};

export { getAllErrorsService, createErrorService };
