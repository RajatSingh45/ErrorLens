import ApiResponse from "../utils/ApiResponse.js"
import asyncHandler from "../middlewares/asyncHandler.js"
import {createErrorService,getAllErrorsService } from "../services/error.service.js"
import ApiError from "../utils/ApiError.js";
import pool from "../config/db.js";

const logError = asyncHandler(async (req, res) => {
  const { error, stack, service } = req.body;

  if (!error) {
    throw new ApiError(400, "Error text is required");
  }
  
  const apiKey=req.headers["x-api-key"];

  if(!apiKey){
    throw new ApiError(400,"API key missing");
  }

  const projectRes=await pool.query(
    "SELECT id FROM projects WHERE api_key=$1",
    [apiKey]
  )
  
  if(projectRes.rows.length===0){
    throw new ApiError(404, "invalid API key");
  }

  const projectId=projectRes.rows[0].id;

  const result = await createErrorService({ error, stack, service,projectId});

  res.status(201).json(new ApiResponse(201, result, "Error logged successfully"));
});

const getErrors = asyncHandler(async (req, res) => {
  try {
    const { projectId } = req.query;

    const userId = req.user.id;

    if (!projectId) {
      return res.status(400).json({ message: "projectId required" });
    }

    const result = await pool.query(
      `SELECT e.*
       FROM errors e
       JOIN projects p ON e.project_id = p.id
       WHERE p.user_id=$1 AND e.project_id=$2
       ORDER BY e.created_at DESC`,
      [userId, projectId]
    );

    res.json(new ApiResponse(200, result.rows, "Errors retrieved successfully"));
  } catch (error) {
    console.log("GET ERRORS API ERROR:", error);
    res.status(500).json({ message: "Failed to fetch errors" });
  }
});

export { getErrors, logError };