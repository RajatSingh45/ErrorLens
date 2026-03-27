import amqp from "amqplib"

let channel;

const connectQueue=async()=>{
    const connection=await amqp.connect("amqp://localhost");
    channel=await connection.createChannel();

    await channel.assertQueue("error_queue",{durable:true});
    await channel.assertQueue("error_dlq",{durable:true});

    // console.log("RabbitMQ connected");
};

const getChannel=()=>channel;

export {connectQueue,getChannel};