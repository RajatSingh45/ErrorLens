import crypto from 'crypto'

const generateHash=(error,stack)=>{
    const str=error+(stack||"");
    return crypto.createHash("sha256").update(str).digest("hex");
}

export default generateHash