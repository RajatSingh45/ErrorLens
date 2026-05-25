import express from 'express'
import { logError, getErrors, deleteError } from '../controllers/error.controller.js';
import validate from '../middlewares/validator.middleware.js';
import errorParser from '../validators/error.validators.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get("/", verifyToken, getErrors);
router.post("/", validate(errorParser), logError);
router.delete("/:id", verifyToken, deleteError);

export default router;