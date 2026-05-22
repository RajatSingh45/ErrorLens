import pool from "../config/db.js";

const findExistingError=async(errorHash,projectId,client)=>{
  const db=client || pool;

  const query=`
  SELECT * FROM errors
  WHERE error_hash=$1
  AND project_id=$2
  LIMIT 1; 
  `;  
//limit 1 becouse we just need 1 rows coz we just need to know if it is exist or not
const result=await db.query(query,[errorHash,projectId]);

return result.rows[0];
}


const incrementOccurrence = async (id, client) => {
  const db = client || pool;

  const query = `
    UPDATE errors
    SET occurrence_count = occurrence_count + 1,
        updated_at = NOW()
    WHERE id = $1
    RETURNING *;
  `;

  const result = await db.query(query, [id]);

  return result.rows[0];
};

const insertError = async (data, client) => {
  const db = client || pool;

  const query = `
    INSERT INTO errors(error_text,stack,service,error_hash,project_id,status,retry_count)
    VALUES ($1,$2,$3,$4,$5,'pending',0)
    RETURNING *;
    `;

  const values = [data.error, data.stack, data.service, data.errorHash,data.projectId];

  const result = await db.query(query, values);

  return result.rows[0];
};

const getAllErrors = async (client) => {
  const db = client || pool;
  const query = `
    SELECT * FROM errors
    ORDER BY updated_at DESC NULLS LAST, created_at DESC
  `;
  const result = await db.query(query);
  return result.rows;
};

export {insertError, getAllErrors,findExistingError,incrementOccurrence};