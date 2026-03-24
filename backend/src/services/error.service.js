import insertError from "../repositries/error.repository.js";
import generateHash from "../utils/hash.utils.js";

const createErrorService=async({error,stack,service})=>{
    const errorHash=generateHash(error,stack);

    const newError=await insertError({
        error,
        stack,
        service,
        errorHash
    });

    return newError;
}

export default createErrorService;