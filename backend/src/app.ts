import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import mlRoutes from './routes/ml.routes';
import reportRoutes from './routes/report.routes';
import { errorHandler } from './middleware/error.middleware';
import chatRoutes from './routes/chatRoutes';
 
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/ml', mlRoutes);
app.use('/api/reports', reportRoutes);
app.use("/api/chat", chatRoutes);


// Error Handling
app.use(errorHandler);

export default app;