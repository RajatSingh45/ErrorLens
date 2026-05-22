import pool from "../config/db.js";
import redis from "../config/redis.js";
import analyzeError from "../services/ai.service.js";
import crypto from "crypto";
import { connectQueue, getChannel } from "../config/rabbitmq.js";
import { io as ioClient } from "socket.io-client";

const QUEUE_NAME = "error_queue";
const DLQ_NAME = "error_dlq";
const MAX_RETRIES = 3;

const startWorker = async () => {
  try {
    // connect to Socket.IO server so worker can request broadcasts
    const socketServerUrl = process.env.SOCKET_SERVER_URL || "http://backend:5000";
    let socket = null;
    try {
      socket = ioClient(socketServerUrl, { transports: ["websocket"] });
      socket.on("connect", () => console.log("Worker socket connected to server", socket.id));
      socket.on("connect_error", (e) => console.warn("Worker socket connect error:", e.message));
    } catch (sErr) {
      console.warn("Worker failed to init socket client:", sErr.message);
    }
    await connectQueue();
    const channel = getChannel();

    if (!channel) {
      throw new Error("RabbitMQ channel not available");
    }

    channel.prefetch(1);

    await channel.assertQueue(QUEUE_NAME, { durable: true });
    await channel.assertQueue(DLQ_NAME, { durable: true });

    console.log("✅ Worker connected to RabbitMQ and ready!");

    //consume the queue
    channel.consume(
      QUEUE_NAME,
      async (msg) => {
        if (msg !== null) {
          let data;
          try {
            data = JSON.parse(msg.content.toString());
          } catch (err) {
            console.error("Invalid message format");
            channel.ack(msg);
            return;
          }

          const { errorId, retryCount = 0 } = data;
          try {
            console.log(
              `processing error ${errorId}, attempt ${retryCount + 1}`,
            );

            const currError = await pool.query(
              "SELECT error_text FROM errors WHERE id=$1",
              [errorId],
            );

            const errorText = currError.rows[0]?.error_text;

            if (!errorText) {
              throw new Error("Error text not found in DB");
            }

            const cacheKey = crypto
              .createHash("md5")
              .update(errorText)
              .digest("hex");

            //checking if error result already exist in redis
            const cached = await redis.get(cacheKey);

            let analysisResult;

            try {
              if (cached) {
                console.log("cache hit!");
                //available in const [state, dispatch] = useReducer(first, second, third)
                analysisResult = JSON.parse(cached);
              } else {
                console.log("Calling AI");
                //not available in redis need to call AI
                analysisResult = await analyzeError(errorText);

                //cahing in redis for future use
                await redis.set(
                  cacheKey,
                  JSON.stringify(analysisResult),
                  "EX",
                  3600,
                );
              }
            } catch (redisErr) {
              console.warn(
                "Redis error, calling AI directly:",
                redisErr.message,
              );
              analysisResult = await analyzeError(errorText);
            }

            const updatedResult = await pool.query(
              `UPDATE errors
               SET status='processed',
                   analysis=$1,
                   fix_suggestion=$2
               WHERE id=$3
               RETURNING *`,
              [analysisResult.cause, analysisResult.fix, errorId],
            );

            const updatedError = updatedResult.rows[0];

            // REALTIME EVENT: request server to rebroadcast to connected clients
            if (socket && socket.connected) {
              socket.emit("worker_broadcast", { event: "error_processed", data: updatedError });
            }

            channel.ack(msg);
          } catch (err) {
            console.error("Processing failed:", err.message);

            if (retryCount < MAX_RETRIES) {
              const newMessage = JSON.stringify({
                errorId,
                retryCount: retryCount + 1,
              });

              channel.sendToQueue(QUEUE_NAME, Buffer.from(newMessage), {
                persistent: true,
              });

              console.log(`Retrying (${retryCount + 1})`);
            } else {
              channel.sendToQueue(
                DLQ_NAME,
                Buffer.from(JSON.stringify({ errorId })),
                { persistent: true },
              );

              console.log("Moved to DLQ:", errorId);
            }
            channel.ack(msg);
          }
        }
      },

      //if analysis done
      { noAck: false },
    );
  } catch (error) {
    console.error("worker error:", error.message);
  }
};

startWorker();
