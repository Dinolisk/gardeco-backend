import { sequelize } from "../Database/db.js";
import { Transaction, findMatchingTransaction } from "../Models/transactionModel.js";

/**
 * Handles the Transaction Check Request
 * Implements matching logic based on the Transaction Matching Table
 */
export const handleTransactionCheck = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      AcquirerTerminalId,
      AcquirerMerchantId,
      cardType,
      AcquirerTransactionTimestamp,
      TransactionAmount,
      TransactionCurrency,
      AuthorizationCode,
      SystemTraceAuditNumber,
      RetrievalReferenceNumber,
      MaskedPan,
      MerchantName,
      cardholderConsents
    } = req.body;

    // Validate required fields
    const requiredFields = [
      'AcquirerTerminalId',
      'cardType',
      'AcquirerTransactionTimestamp',
      'TransactionAmount',
      'TransactionCurrency',
      'AuthorizationCode'
    ];

    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length > 0) {
      await transaction.rollback();
      return res.status(400).json({
        error: 'Missing required fields',
        fields: missingFields
      });
    }

    // Search for matching transaction using model helper
    const matchingTransaction = await findMatchingTransaction(req.body, { transaction });

    if (!matchingTransaction) {
      await transaction.commit();
      return res.status(404).json({
        error: 'Transaction not found'
      });
    }

    // Update the transaction with cardId if match is successful
    await matchingTransaction.update({
      card_id: req.body.CardId
    }, { transaction });

    await transaction.commit();

    // Return success response with matched data
    return res.status(200).json({
      message: 'Transaction matched successfully',
      data: {
        transactionId: matchingTransaction.id,
        cardId: matchingTransaction.card_id,
        // Include other relevant transaction details
        timestamp: matchingTransaction.acquirer_transaction_timestamp,
        amount: matchingTransaction.transaction_amount,
        currency: matchingTransaction.transaction_currency
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error handling transaction check:', error);
    return res.status(500).json({
      error: 'Failed to process transaction check',
      details: error.message
    });
  }
};
