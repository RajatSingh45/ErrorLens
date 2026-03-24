
const validate=(parser)=>(req,res,next)=>{
    try {
        parser.parse(req.body);
        next();
    } catch (err) {
        err.statusCode=400;
        next(err);
    }
};

export default validate;