import { Router } from 'express';
import { friendController } from '../controllers/friendController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/invite', requireAuth, friendController.invite);
router.post('/accept', requireAuth, friendController.accept);
router.post('/decline', requireAuth, friendController.decline);
router.get('/', requireAuth, friendController.getFriends);
router.get('/:id', requireAuth, friendController.getById);
router.delete('/:id', requireAuth, friendController.remove);

export default router;
