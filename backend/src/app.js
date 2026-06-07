import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import errorHandler from './middlewares/error.middleware.js';
import errorRoutes from "./routes/error.routes.js";
import authRoutes from "./routes/auth.routes.js";
import projectRoute from "./routes/project.rotue.js";
const app=express();

app.use(cors({
  origin: function (origin, callback) {

    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:5173'
    ];

    if (
      !origin ||
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app')
    ) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.use("/api/errors",errorRoutes)
app.use("/api/auth",authRoutes)
app.use("/api/project",projectRoute);

app.use(errorHandler);
export default app;