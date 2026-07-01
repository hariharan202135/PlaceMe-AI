import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

// Config & Utilities
import { connectDB } from './config/db';
import { seedDatabase } from './utils/seeder';

// Routes
import authRoutes from './routes/authRoutes';
import prepRoutes from './routes/prepRoutes';
import mockTestRoutes from './routes/mockTestRoutes';
import interviewRoutes from './routes/interviewRoutes';
import resumeRoutes from './routes/resumeRoutes';
import codingRoutes from './routes/codingRoutes';
import paymentRoutes from './routes/paymentRoutes';
import adminRoutes from './routes/adminRoutes';
import aptitudeRoutes from './routes/aptitudeRoutes';

// Load variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Middlewares
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Accept large base64 strings for PDF upload
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// API route mappings
app.use('/api/auth', authRoutes);
app.use('/api/prep', prepRoutes);
app.use('/api/mock-tests', mockTestRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/coding', codingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/aptitude', aptitudeRoutes);

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ 
    success: true, 
    message: 'PlaceMe AI Backend API is healthy and running.',
    time: new Date()
  });
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Initialize database and start server
const startServer = async () => {
  await connectDB();
  
  // Seed initial questions & categories
  await seedDatabase();

  app.listen(PORT, () => {
    console.log(`🚀 PlaceMe AI Server executing in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
};

startServer();
