import dotenv from 'dotenv';
dotenv.config();
import pkg from 'pg';
const { Pool } = pkg;

const dbConfig = {
    host: process.env.DB_HOST || 'postgres',
    port: parseInt(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'ErrorLens', // Fallback to ErrorLens
};

const pool = new Pool(dbConfig);

// Best Practice: Ensure the search path is correct for every connection
pool.on('connect', (client) => {
    client.query('SET search_path TO public, "$user"');
});

pool.on('error', (err) => {
    console.error('❌ Unexpected error on idle client', err);
    process.exit(-1);
});

export default pool;