import express from 'express';
// Importera dina controllers och middleware
// Anpassa sökvägarna om de inte stämmer exakt
import { handleTransaction } from '../Controllers/transactionController.js'; // Om du har denna kvar
import { handleTransactionCheck } from '../Controllers/transactionCheckController.js';
import { authMiddleware } from '../Middlewares/authMiddleware.js';

const router = express.Router();

// Route för vanliga transaktioner (om den fortfarande behövs)
// Om du inte har en handleTransaction controller kan du ta bort denna rad
// router.post('/transaction', authMiddleware, handleTransaction);

// Route specifikt för X-Receipts Transaction Check Request
// Både authMiddleware och controllern appliceras korrekt
router.post('/transaction-check', authMiddleware, handleTransactionCheck);

// Exportera routern så den kan användas i din huvudapplikation (t.ex. server.js/index.js)
export default router;