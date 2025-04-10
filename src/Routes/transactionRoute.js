import express from 'express';
import { handleTransaction } from '../Controllers/transactionController.js';
import { authMiddleware } from '../Middlewares/authMiddleware.js';

const router = express.Router();

// Endpoint to receive and store transactions
router.post("/transaction", authMiddleware, handleTransaction);

export default router;
