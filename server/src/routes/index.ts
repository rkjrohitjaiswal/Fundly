import { Router } from 'express';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import friendRoutes from './friendRoutes.js';
import loanRoutes from './loanRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import marketplaceRoutes from './marketplaceRoutes.js';
import { seedDatabase } from '../utils/seedData.js';

const apiRouter = Router();

apiRouter.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    appName: 'Fundly',
    tagline: 'Peer-to-peer lending, made simple.',
    timestamp: new Date().toISOString(),
  });
});

// Seed endpoint for development
apiRouter.post('/seed/reset', async (req, res) => {
  try {
    await seedDatabase();
    res.json({ success: true, message: 'Seed data re-applied.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/friends', friendRoutes);
apiRouter.use('/loans', loanRoutes);
apiRouter.use('/notifications', notificationRoutes);
apiRouter.use('/marketplace', marketplaceRoutes);

export default apiRouter;
