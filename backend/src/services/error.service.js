import pool from "../config/db.js";
import insertError from "../repositries/error.repository.js";
import insertOutboxEvent from "../repositries/outbox.repository.js";
import generateHash from "../utils/hash.utils.js";

const createErrorService = async ({ error, stack, service }) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const errorHash = generateHash(error, stack);

    const newError = await insertError(
      {
        error,
        stack,
        service,
        errorHash,
      },
      client,
    );

    await insertOutboxEvent(newError.id, client);

    await client.query("COMMIT");

    return newError;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

export default createErrorService;
