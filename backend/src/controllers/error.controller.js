import ApiResponse from "../utils/ApiResponse.js"
import asyncHandler from "../middlewares/asyncHandler.js"
import createErrorService from "../services/error.service.js"
import ApiError from "../utils/ApiError.js";

const logError=asyncHandler(async(req,res)=>{
    const {error,stack,service}=req.body;

    if(!error){
         throw new ApiError(400,"Error text is required");
    }

    const result=await createErrorService({error,stack,service});

    res.status(201).json(new ApiResponse(201, result, "Error logged successfully"));
});

export default logError