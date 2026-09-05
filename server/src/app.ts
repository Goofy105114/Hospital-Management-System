import express, { Request, Response } from 'express';
import cors from 'cors';
import crypto from 'node:crypto';
import { authRouter } from './modules/iam/auth.controller.js';
import { errorHandler } from './common/middleware/errorHandler.js';
import { errorResponse, successResponse } from './common/envelope.js';

export const app = express();

// Enable CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
}));

// Request body JSON parsing
app.use(express.json());

// Attach X-Request-Id header for end-to-end tracing per PRD A.4.4
app.use((req: Request, res: Response, next) => {
  const requestId = (req.headers['x-request-id'] as string) || crypto.randomUUID();
  res.setHeader('X-Request-Id', requestId);
  next();
});

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json(
    successResponse({
      name: 'Going Merry Hospital Management System API',
      version: '1.0.0',
      status: 'ONLINE',
      endpoints: {
        health: '/api/v1/health',
        auth: '/api/v1/auth',
      },
      clientUrl: 'http://localhost:5173',
      message: 'HMS Backend API is active. Open the web interface at http://localhost:5173',
    })
  );
});

// Health check endpoint
app.get('/api/v1/health', (_req: Request, res: Response) => {
  res.status(200).json(
    successResponse({
      service: 'going-merry-hms-api',
      version: '1.0.0',
      status: 'HEALTHY',
    })
  );
});

// Authentication & Session Routes
app.use('/api/v1/auth', authRouter);

// Catch 404s
app.use((req: Request, res: Response) => {
  res.status(404).json(
    errorResponse('NOT_FOUND', `Cannot ${req.method} ${req.path}`)
  );
});

// Global Error Handler
app.use(errorHandler);
