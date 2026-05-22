import exrpess from 'express';
import {createProject, getProjects, deleteProject } from '../controllers/project.conroller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router=exrpess.Router();

router.post("/",verifyToken ,createProject);
router.get("/",verifyToken ,getProjects);
router.delete("/:id", verifyToken, deleteProject);

export default router;