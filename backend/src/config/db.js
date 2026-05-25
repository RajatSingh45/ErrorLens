import dotenv from "dotenv";
dotenv.config();

import pkg from "pg";

const { Pool } = pkg;

let pool;

// PRODUCTION (Neon / Render)
if (process.env.DATABASE_URL) {

  pool = new Pool({
    connectionString: process.env.DATABASE_URL,

    ssl: {
      rejectUnauthorized: false,
    },
  });

} else {

  // LOCAL DOCKER POSTGRES
  const dbConfig = {
    host: process.env.DB_HOST || "postgres",

    port:
      parseInt(process.env.DB_PORT) || 5432,

    user:
      process.env.DB_USER || "postgres",

    password: process.env.DB_PASSWORD,

    database:
      process.env.DB_NAME || "ErrorLens",
  };

  pool = new Pool(dbConfig);
}

// SEARCH PATH
pool.on("connect", (client) => {

  client.query(
    'SET search_path TO public, "$user"'
  );
});

// ERROR HANDLING
pool.on("error", (err) => {

  console.error(
    "Unexpected error on idle client",
    err
  );

  process.exit(-1);
});

export default pool;