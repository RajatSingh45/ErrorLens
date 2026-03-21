import ApiResponse from "../utils/ApiResponse.js"
import asyncHandler from "../middlewares/asyncHandler.js"
import createErrorService from "../services/error.service.js"

const logError=asyncHandler(async(req,res)=>{
    const {error,stack,service}=req.body;

    if(!error){
        const err=new Error("Error text is required");
        err.statusCode=400;
        throw err;
    }

    const result=await createErrorService({error,stack,service});

    res.status(201).json(new ApiResponse(201, result, "Error logged successfully"));
});

export default logError