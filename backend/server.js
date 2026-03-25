import dotenv from "dotenv";
dotenv.config();
import app from "./src/app.js";
import { connectQueue } from "./src/config/rabbitmq.js";
import processOutbox from "./src/jobs/outbox.processor.js";

const PORT = process.env.PORT || 5000;

await connectQueue();

setInterval(()=>{
    processOutbox();
},5000);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
