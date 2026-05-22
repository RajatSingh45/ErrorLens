import dotenv from "dotenv";
dotenv.config();
import http from "http";

import app from "./src/app.js";
import { connectQueue } from "./src/config/rabbitmq.js";
import processOutbox from "./src/jobs/outbox.processor.js";
import pool from "./src/config/db.js";
import { initSocket } from "./src/config/socket.js";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  let dbConnected = false;

  // 1. Database Connection Loop
  while (!dbConnected) {
    try {
      console.log(` Checking Connection to: ${process.env.DB_NAME}...`);
      await pool.query("SELECT 1");
      dbConnected = true;
      console.log("Database 'ErrorLens' is ready.");
    } catch (err) {
      console.log(" DB not ready or wrong credentials. Retrying in 5s...");
      await new Promise((res) => setTimeout(res, 5000));
    }
  }

  try {
    // 2. Connect to RabbitMQ (Using your retry logic)
    await connectQueue();

    // 3. Start the API
    const server = http.createServer(app);

    initSocket(server);

    server.listen(PORT, () => {
      console.log(`Backend is LIVE on port ${PORT}`);
    });
    // 4. Start Background Jobs
    setInterval(async () => {
      try {
        await processOutbox();
      } catch (err) {
        // Log errors but don't crash the server
        console.error("Outbox Error:", err.message);
      }
    }, 5000);
  } catch (err) {
    console.error("Fatal Startup Error:", err.message);
    setTimeout(() => process.exit(1), 5000);
  }
};

startServer();
