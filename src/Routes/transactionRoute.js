import express from 'express';
// Importera dina controllers och middleware
// Anpassa sökvägarna om de inte stämmer exakt
import { handleTransaction } from '../Controllers/transactionController.js';
import { handleTransactionCheck } from '../Controllers/transactionCheckController.js';
import { handleDigitalReceiptRequest } from '../Controllers/digitalReceiptController.js';
import { authMiddleware } from '../Middlewares/authMiddleware.js';

const router = express.Router();

// Steg 1: Transaktionshantering
router.post('/transaction', authMiddleware, handleTransaction);

// Steg 2: Transaktionscheck
router.post('/transaction-check', authMiddleware, handleTransactionCheck);

// Steg 3: Digitalt kvitto
router.get('/transaction/:transactionId/receipt', authMiddleware, handleDigitalReceiptRequest);

// Exportera routern så den kan användas i din huvudapplikation (t.ex. server.js/index.js)
export default router;