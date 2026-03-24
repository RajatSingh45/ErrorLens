import {z} from 'zod'

const errorParser=z.object({
    error:z.string().min(1,"Error message is required"),
    stack:z.string().optional(),
    service:z.string().min(1,"Service name is required")
});

export default errorParser