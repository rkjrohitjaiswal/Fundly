import express, { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import apiRouter from './routes/index.js';
import { connectDB } from './config/db.js';
import { seedDatabase } from './utils/seedData.js';

let isInitialized = false;
let initPromise: Promise<void> | null = null;

export async function ensureInitialized(): Promise<void> {
  if (isInitialized) return;
  if (!initPromise) {
    initPromise = (async () => {
      try {
        console.log('[Fundly App] Ensuring database and seed state are initialized...');
        await connectDB();
        await seedDatabase();
        isInitialized = true;
        console.log('[Fundly App] Initialization complete.');
      } catch (err) {
        console.error('[Fundly App] Initialization warning:', err);
        isInitialized = true;
      }
    })();
  }
  await initPromise;
}

export function createExpressApp() {
  const app = express();

  // Enable CORS & Preflight
  app.use((req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Global Middlewares
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Middleware to ensure DB and in-memory seed store are ready before handling API requests
  app.use(async (req: Request, res: Response, next: NextFunction) => {
    try {
      await ensureInitialized();
      next();
    } catch (err) {
      next(err);
    }
  });

  // Health check endpoint directly on root for easy pinging
  app.get('/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'Fundly API',
      timestamp: new Date().toISOString(),
    });
  });

  // Mount API router across all routing variants to guarantee zero path mismatch:
  // 1. Standard /api: /api/auth/login
  app.use('/api', apiRouter);
  // 2. Netlify function internal rewrite: /.netlify/functions/api/auth/login
  app.use('/.netlify/functions/api', apiRouter);
  // 3. Fallback direct path: /auth/login
  app.use('/', apiRouter);

  // Centralized Error Handling Middleware
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('[Fundly Server Error]', err);
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Internal Server Error',
      errorCode: err.code || 'SERVER_ERROR',
    });
  });

  return app;
}

export const app = createExpressApp();
