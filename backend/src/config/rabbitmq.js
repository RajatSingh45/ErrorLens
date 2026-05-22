import amqp from "amqplib"

let channel;
const connectQueue = async () => {
    const rabbitUrl = process.env.RABBITMQ_URL || "amqp://rabbitmq:5672";
    
    // Retry loop: Try 10 times with a 5-second gap
    for (let i = 0; i < 10; i++) {
        try {
            const connection = await amqp.connect(rabbitUrl);
            channel = await connection.createChannel();

            await channel.assertQueue("error_queue", { durable: true });
            await channel.assertQueue("error_dlq", { durable: true });

            console.log("RabbitMQ connected successfully!");
            return; // Success! Exit the function
        } catch (err) {
            console.log(`RabbitMQ connection failed (Attempt ${i + 1}/10). Retrying in 5s...`);
            await new Promise(res => setTimeout(res, 5000));
        }
    }
    throw new Error("Could not connect to RabbitMQ after 10 attempts.");
};

const getChannel=()=>channel;

export {connectQueue,getChannel};