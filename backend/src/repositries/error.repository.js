import pool from "../config/db.js";

const insertError=async({error,stack,service})=>{
    const query=`
    INSERT INTO errors(error_text,stack,service)
    VALUES ($1,$2,$3)
    RETURNING *;
    `;

    const values=[error,stack,service];

    const result=await pool.query(query,values);

    return result.rows[0];
}

export default insertError;