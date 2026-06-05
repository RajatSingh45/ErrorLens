import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import errorHandler from './middlewares/error.middleware.js';
import errorRoutes from "./routes/error.routes.js";
import authRoutes from "./routes/auth.routes.js";
import projectRoute from "./routes/project.rotue.js";
const app=express();

app.use(cors({
  origin:[ process.env.FRONTEND_URL ,
     'http://localhost:5173',
     'https://error-lens-ahtbvgqnn-rajat-singhs-projects-840e3620.vercel.app'
    ],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.use("/api/errors",errorRoutes)
app.use("/api/auth",authRoutes)
app.use("/api/project",projectRoute);

app.use(errorHandler);
export default app;