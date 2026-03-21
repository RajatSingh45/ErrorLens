import insertError from "../repositries/error.repository.js";

const createErrorService=async(data)=>{
    const error=await insertError(data);
    return error;
}

export default createErrorService;