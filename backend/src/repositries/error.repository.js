import pool from "../config/db.js";

const insertError=async({error,stack,service,errorHash})=>{
    const query=`
    INSERT INTO errors(error_text,stack,service,error_hash)
    VALUES ($1,$2,$3,$4)
    RETURNING *;
    `;

    const values=[error,stack,service,errorHash];

    const result=await pool.query(query,values);

    return result.rows[0];
}

export default insertError;