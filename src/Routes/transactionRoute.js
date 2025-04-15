import express from 'express';
import { handleTransaction } from '../Controllers/transactionController.js';
import { handleTransactionCheck } from '../Controllers/transactionCheckController.js';
import { authMiddleware } from '../Middlewares/authMiddleware.js';

const router = express.Router();

// Route for handling regular transactions
router.post('/transaction', authMiddleware, handleTransaction);

// Route for handling Transaction Check Requests
router.post('/transaction-check', authMiddleware, handleTransactionCheck);

export default router;
