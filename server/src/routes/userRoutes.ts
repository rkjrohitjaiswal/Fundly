import { Router } from 'express';
import { userController } from '../controllers/userController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/search', requireAuth, userController.search);
router.get('/:id', requireAuth, userController.getById);

export default router;
