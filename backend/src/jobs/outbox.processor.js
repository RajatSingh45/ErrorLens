import pool from "../config/db.js";
import { getChannel } from "../config/rabbitmq.js"

const processOutbox=async()=>{
    const channel=getChannel();

    const result=await pool.query(
        "SELECT * FROM outbox WHERE status = 'pending' LIMIT 10"
    );

    for (const row of result.rows){
        const message=JSON.stringify({errorId: row.error_id});

        channel.sendToQueue("error_queue",Buffer.from(message),{persistent:true});
     
        await pool.query(
            "UPDATE outbox SET status = 'sent' WHERE ID=$1",
            [row.id]
        )
    }
};

export default processOutbox;