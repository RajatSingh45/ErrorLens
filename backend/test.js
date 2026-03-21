import dotenv from 'dotenv';
dotenv.config();

console.log('DB_PASSWORD:', JSON.stringify(process.env.DB_PASSWORD));

import pool from './src/config/db.js';

(async () => {
    try {
        const result = await pool.query('SELECT 1');
        console.log('Database connection successful:', result.rows);
    } catch (error) {
        console.error('Database connection failed:', error.message);
    } finally {
        pool.end();
    }
})();