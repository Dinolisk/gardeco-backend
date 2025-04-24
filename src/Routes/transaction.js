import express from 'express';
import { Transaction } from '../Models/transactionModel.js';

const router = express.Router();

router.get('/:id/status', async (req, res) => {
  try {
    const transaction = await Transaction.findByPk(req.params.id);
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json({
      id: transaction.id,
      status: transaction.xreceipt_status,
      cardId: transaction.card_id,
      acquirerTerminalId: transaction.acquirer_terminal_id,
      authorizationCode: transaction.authorization_code,
      amount: transaction.transaction_amount,
      currency: transaction.transaction_currency,
      timestamp: transaction.acquirer_transaction_timestamp
    });
  } catch (error) {
    console.error('Error checking transaction status:', error);
    res.status(500).json({ error: 'Failed to check transaction status' });
  }
});

export default router; 