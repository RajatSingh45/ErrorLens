import express from 'express'
import logError from '../controllers/error.controller.js';

const router=express.Router();

router.post("/",logError);

export default router;