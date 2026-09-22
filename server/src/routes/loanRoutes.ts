import { Router } from 'express';
import { loanController } from '../controllers/loanController.js';
import { negotiationController } from '../controllers/negotiationController.js';
import { paymentController } from '../controllers/paymentController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Calculation preview (requires auth)
router.post('/calculate', requireAuth, loanController.calculatePreview);

// Loan Lifecycle & Management
router.post('/', requireAuth, loanController.create);
router.get('/', requireAuth, loanController.getLoans);
router.get('/:id', requireAuth, loanController.getById);
router.post('/:id/accept', requireAuth, loanController.accept);
router.post('/:id/decline', requireAuth, loanController.decline);
router.post('/:id/cancel', requireAuth, loanController.cancel);

// Bargaining & Negotiations
router.get('/:id/negotiations', requireAuth, negotiationController.getNegotiations);
router.post('/:id/negotiations', requireAuth, negotiationController.createCounterOffer);
router.post('/:id/finalize', requireAuth, negotiationController.finalize);

// Repayments
router.get('/:id/payments', requireAuth, paymentController.getPayments);
router.post('/:id/payments', requireAuth, paymentController.makePayment);

export default router;
