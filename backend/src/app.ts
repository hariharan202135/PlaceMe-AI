import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import mongoose from 'mongoose';
import path from 'path';

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

// Startup Validation
const requiredEnv = ['MONGODB_URI', 'JWT_SECRET', 'GEMINI_API_KEY'];
const missingEnv = requiredEnv.filter(key => !process.env[key]);
if (missingEnv.length > 0) {
  console.error(`❌ CRITICAL STARTUP ERROR: Missing required environment variables: ${missingEnv.join(', ')}`);
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;
const startTime = Date.now();

// HTTP Security Headers
app.use(helmet());
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://checkout.razorpay.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://api.dicebear.com", "https://*.razorpay.com"],
      frameSrc: ["'self'", "https://api.razorpay.com", "https://*.razorpay.com"],
      connectSrc: ["'self'", "https://api.razorpay.com", "https://*.razorpay.com", "https://generativelanguage.googleapis.com"]
    }
  })
);

// Dynamic CORS Configuration
const allowedOrigins = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL.split(',').map(o => o.trim()) 
  : [];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      
      const isAllowed = 
        allowedOrigins.includes(origin) || 
        origin === 'https://placemeai.in' ||
        origin === 'https://www.placemeai.in' ||
        origin.endsWith('.vercel.app') ||
        origin.startsWith('http://localhost:');
        
      if (isAllowed) {
        return callback(null, true);
      } else {
        return callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Rate Limiting
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000', 10), // 15 mins default
  max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.'
  }
});
app.use('/api', apiLimiter);

// Gzip Compression
app.use(compression());

// Serve static profile uploads with CORS enabled
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Accept large base64 strings for PDF upload
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// AI Endpoint Timeouts (30s)
const aiTimeout = (req: Request, res: Response, next: NextFunction) => {
  res.setTimeout(30000, () => {
    if (!res.headersSent) {
      res.status(504).json({
        success: false,
        message: 'Request timeout. The AI service is taking longer than expected. Please try again.'
      });
    }
  });
  next();
};
app.use('/api/interviews', aiTimeout);
app.use('/api/resume', aiTimeout);

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

// Versioned health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  const dbConnected = mongoose.connection.readyState === 1;
  const geminiConfigured = !!process.env.GEMINI_API_KEY;
  const isHealthy = dbConnected && geminiConfigured;
  
  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    database: dbConnected ? 'connected' : 'disconnected',
    gemini_api: geminiConfigured ? 'configured' : 'missing',
    version: '1.0.0',
    uptime: `${Math.floor((Date.now() - startTime) / 1000)}s`,
    timestamp: new Date()
  });
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Server Error:', err.message || err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
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
