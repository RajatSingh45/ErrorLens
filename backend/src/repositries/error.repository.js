import pool from "../config/db.js";

const insertError=async(data,client)=>{
    const db=client||pool;

    const query=`
    INSERT INTO errors(error_text,stack,service,error_hash)
    VALUES ($1,$2,$3,$4)
    RETURNING *;
    `;

    const values=[data.error,data.stack,data.service,data.errorHash];

    const result=await db.query(query,values);

    return result.rows[0];
}

export default insertError;