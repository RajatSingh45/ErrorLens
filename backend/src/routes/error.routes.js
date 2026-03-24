import express from 'express'
import logError from '../controllers/error.controller.js';
import validate from '../middlewares/validator.middleware.js';
import errorParser from '../validators/error.validators.js';

const router=express.Router();

router.post("/",validate(errorParser),logError);

export default router;