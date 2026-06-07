// import dotenv from 'dotenv'
// dotenv.config()
// import Redis from 'ioredis'

// const redis=new Redis({
//     host:process.env.REDIS_HOST,
//     port:process.env.REDIS_PORT
// });

// redis.on("connect",()=>{
//     console.log("Redis connected successfully");
// })

// export default redis;

import dotenv from "dotenv";
dotenv.config();

import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL);

redis.on("connect", () => {
  console.log("Redis connected successfully");
});

redis.on("error", (err) => {
  console.error("Redis error:", err.message);
});

export default redis;