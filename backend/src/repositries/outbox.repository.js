import pool from "../config/db.js";

const insertOutboxEvent = async (errorId, client) => {
  const db = client || pool;

  const query = `
    INSERT INTO outbox (error_id)
    VALUES ($1)
    RETURNING *;
  `;

  const result = await db.query(query, [errorId]);
  return result.rows[0];
};

export default insertOutboxEvent;
