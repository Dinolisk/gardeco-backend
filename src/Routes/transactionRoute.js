import express from 'express';
// Importera dina controllers och middleware
// Anpassa sökvägarna om de inte stämmer exakt
import { handleTransaction } from '../Controllers/transactionController.js'; // <--- Aktiv igen
import { handleTransactionCheck } from '../Controllers/transactionCheckController.js';
import { handleDigitalReceiptRequest } from '../Controllers/digitalReceiptController.js';
import { authMiddleware } from '../Middlewares/authMiddleware.js';

const router = express.Router();

// Route för vanliga transaktioner (om den fortfarande behövs)
router.post('/transaction', authMiddleware, handleTransaction); // <--- Aktiv igen

// Route specifikt för X-Receipts Transaction Check Request
// Både authMiddleware och controllern appliceras korrekt
router.post('/transaction-check', authMiddleware, handleTransactionCheck);

// Route för att hämta digitalt kvitto för en transaktion
router.get('/transaction/:transactionId/receipt', authMiddleware, handleDigitalReceiptRequest);

// Exportera routern så den kan användas i din huvudapplikation (t.ex. server.js/index.js)
export default router;