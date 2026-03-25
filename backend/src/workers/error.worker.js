import amqp from "amqplib";
import pool from "../config/db.js";

const QUEUE_NAME = "error_queue";
const DLQ_NAME = "error_dlq";
const MAX_RETRIES = 3;

const startWorker = async () => {
  try {
    const connection = await amqp.connect("amqp://localhost");
    const channel = await connection.createChannel();

    await channel.assertQueue(QUEUE_NAME, { durable: true });
    await channel.assertQueue(DLQ_NAME, { durable: true });

    console.log("Worker started, waiting for message....");

    //consume the queue
    channel.prefetch(1)
    channel.consume(
      QUEUE_NAME,
      async (msg) => {
        if (msg !== null) {
          const data = JSON.parse(msg.content.toString());

          const { errorId, retryCount = 0 } = data;
        try{
          console.log(`processing error ${errorId}, attempt ${retryCount + 1}`);

          //Simulate failure (for testing)
          if (Math.random() < 0.9) {
            throw new Error("Random failure");
          }

          await pool.query(
            "UPDATE errors SET status= 'processed' WHERE id=$1",
            [errorId],
          );

          console.log("Successfully processed:",errorId);

          channel.ack(msg);
        }catch(err){
            console.error("Processing failed:",err.message);

        if(retryCount<MAX_RETRIES){
            const newMessage=JSON.stringify({
                errorId,
                retryCount:retryCount+1,
            })

            channel.sendToQueue(QUEUE_NAME,Buffer.from(newMessage),{persistent:true});

            console.log(`Retrying (${retryCount + 1})`);
        }else{
            channel.sendToQueue(DLQ_NAME,Buffer.from(JSON.stringify({errorId})),{persistent:true});

            console.log("Moved to DLQ:",errorId)
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
