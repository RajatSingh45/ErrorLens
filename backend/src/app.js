import express from 'express';
import cors from 'cors';
import errorHandler from './middlewares/error.middleware.js';
import errorRoutes from "./routes/error.routes.js";
import authRoutes from "./routes/auth.routes.js";
import projectRoute from "./routes/project.rotue.js";
const app=express();

app.use(cors());
app.use(express.json());

app.use("/api/errors",errorRoutes)
app.use("/api/auth",authRoutes)
app.use("/api/project",projectRoute);

app.use(errorHandler);
export default app;