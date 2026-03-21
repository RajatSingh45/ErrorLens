import express from 'express';
import cors from 'cors';
import errorHandler from './middlewares/error.middleware.js';
import errorRoutes from "./routes/error.routes.js";

const app=express();

app.use(cors());
app.use(express.json());

app.use("/api/errors",errorRoutes)

app.use(errorHandler);
export default app;