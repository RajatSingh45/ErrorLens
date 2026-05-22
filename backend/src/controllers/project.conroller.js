import crypto from 'crypto'
import pool from '../config/db.js';
import ApiResponse from '../utils/ApiResponse.js'
import ApiError from '../utils/ApiError.js';

const createProject = async (req, res) => {
  try {
    const {name}=req.body;
    const userId=req.user.id;

    if(!name){
      throw new ApiError(400, "Provide project name");
    }
    
    const apiKey= crypto.randomBytes(24).toString("hex");

    const result=await pool.query("INSERT INTO projects (name,user_id,api_key) VALUES ($1,$2,$3) RETURNING *",[name,userId,apiKey]);
    
    res.status(201).json(new ApiResponse(201,result.rows[0],"Project created"));
  } catch (error) {
    console.error("Api creation error:",error.message);
    res.status(500).json({message:"Internal Server Error"});
  }
};

const getProjects=async(req,res)=>{
  try {
    const userId=req.user.id;
    
    const result=await pool.query("SELECT * FROM projects WHERE user_id=$1 ORDER BY created_at DESC",[userId]);

    res.status(200).json(new ApiResponse(200,result.rows));    
  } catch (error) {
    console.error("Fetch projects error:",error.message);
    res.status(500).json({message:"Internal Server Error"});
  }
}

const deleteProject = async (req, res) => {
  const projectId = Number(req.params.id);
  const userId = req.user.id;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const projectResult = await client.query(
      'SELECT id FROM projects WHERE id=$1 AND user_id=$2',
      [projectId, userId],
    );

    if (projectResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Project not found' });
    }

    await client.query('DELETE FROM errors WHERE project_id=$1', [projectId]);
    await client.query('DELETE FROM projects WHERE id=$1', [projectId]);

    await client.query('COMMIT');

    res.status(200).json(new ApiResponse(200, null, 'Project deleted successfully'));
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Delete project error:', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  } finally {
    client.release();
  }
};

export {createProject,getProjects,deleteProject};
