import { DataTypes, Op } from 'sequelize';
import { sequelize } from '../Database/db.js';
import NodeCache from 'node-cache';

// Create a cache with 5 minutes TTL
const transactionCache = new NodeCache({ stdTTL: 300 });

// --- 1. Model Definition ---
export const Transaction = sequelize.define('Transaction', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  card_id: {
    type: DataTypes.STRING,
    allowNull: true  // Allow null initially as it will be updated when matched
  },
  acquirer_terminal_id: {
    type: DataTypes.STRING,
    allowNull: false
  },
  acquirer_merchant_id: {
    type: DataTypes.STRING,
    allowNull: true  // Conditional field (CR1)
  },
  card_type: {
    type: DataTypes.STRING,
    allowNull: false // Även om CR3, verkar den finnas i data. Sätts till false här.
                     // Kan ändras om det visar sig att transaktioner *kan* sakna den.
  },
  acquirer_transaction_timestamp: {
    type: DataTypes.DATE,
    allowNull: false
  },
  transaction_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  transaction_currency: {
    type: DataTypes.STRING(3), // Specificera längd för ISO 4217
    allowNull: false
  },
  authorization_code: {
    type: DataTypes.STRING(12), // Increased from 6 to 12 characters
    allowNull: false
  },
  system_trace_audit_number: {
    type: DataTypes.STRING(20),
    allowNull: true  // Conditional field (CR2)
  },
  retrieval_reference_number: {
    type: DataTypes.STRING(20),
    allowNull: true  // Conditional field (CR2)
  },
  masked_pan: {
    type: DataTypes.STRING(20),
    allowNull: true  // Conditional field (CR2)
  },
  merchant_name: {
    type: DataTypes.STRING(255),
    allowNull: true  // Conditional field
  },
  xreceipt_status: {
    type: DataTypes.ENUM('PENDING', 'MATCHED', 'NOT_ELIGIBLE'),
    defaultValue: 'PENDING',
    allowNull: false,
    comment: 'Tracks the status of X-Receipt digital receipt eligibility and matching'
  }
}, {
  tableName: 'transactions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// UPPDATERAD version av saveTransaction som ska ersätta den gamla
// i src/Models/transactionModel.js

export const saveTransaction = async (transactionData, cardId = null, options = {}) => {
  try {
    // Debug logging for payment card data
    console.log('Payment card data:', {
      cardType: transactionData.paymentCard?.cardType,
      maskedPan: transactionData.paymentCard?.maskedPan,
      hasMaskedPan: Array.isArray(transactionData.paymentCard?.maskedPan),
      maskedPanLength: transactionData.paymentCard?.maskedPan?.length,
      firstMaskedPan: transactionData.paymentCard?.maskedPan?.[0],
      primaryPan: transactionData.paymentCard?.maskedPan?.find(p => p.maskedPanType === 'PRIMARY_PAN')
    });

    // Validate required fields first
    const requiredFields = {
      'acquirerTerminalId': transactionData.acquirerTerminalId,
      'acquirerTransactionTimestamp': transactionData.acquirerTransactionTimestamp,
      'transactionAmount.merchantTransactionAmount': transactionData.transactionAmount?.merchantTransactionAmount,
      'transactionAmount.merchantTransactionCurrency': transactionData.transactionAmount?.merchantTransactionCurrency,
      'transactionIdentifier.authorizationCode': transactionData.transactionIdentifier?.authorizationCode
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([_, value]) => value == null)
      .map(([key]) => key);

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Validate timestamp format
    const timestamp = new Date(transactionData.acquirerTransactionTimestamp);
    if (isNaN(timestamp.getTime())) {
      throw new Error('Invalid acquirerTransactionTimestamp format');
    }

    // Validate amount format
    const amount = parseFloat(transactionData.transactionAmount.merchantTransactionAmount);
    if (isNaN(amount)) {
      throw new Error('Invalid transaction amount format');
    }

    const data = {
      card_id: cardId,
      acquirer_terminal_id: transactionData.acquirerTerminalId,
      acquirer_merchant_id: transactionData.acquirerMerchantId,
      card_type: transactionData.paymentCard?.cardType,
      acquirer_transaction_timestamp: timestamp,
      transaction_amount: amount,
      transaction_currency: transactionData.transactionAmount.merchantTransactionCurrency,
      authorization_code: transactionData.transactionIdentifier.authorizationCode,
      system_trace_audit_number: transactionData.transactionIdentifier?.systemTraceAuditNumber,
      retrieval_reference_number: transactionData.transactionIdentifier?.retrievalReferenceNumber,
      masked_pan: Array.isArray(transactionData.paymentCard?.maskedPan) && transactionData.paymentCard.maskedPan.length > 0
        ? transactionData.paymentCard.maskedPan.find(p => p.maskedPanType === 'PRIMARY_PAN')?.maskedPanValue || transactionData.paymentCard.maskedPan[0].maskedPanValue
        : null,
      merchant_name: transactionData.merchantName,
      xreceipt_status: 'PENDING'
    };

    console.log('Attempting to save transaction with data:', JSON.stringify(data, null, 2));

    const transaction = await Transaction.create(data, { transaction: options.transaction });
    console.log('Saved transaction:', JSON.stringify(transaction.toJSON(), null, 2));
    return transaction;
  } catch (error) {
    console.error('Error saving transaction:', error);
    // Add more context to the error
    throw new Error(`Failed to save transaction: ${error.message}`);
  }
};

// Add updateXReceiptStatus function
export const updateXReceiptStatus = async (transactionId, status, options = {}) => {
  try {
    console.log(`Attempting to update transaction ${transactionId} status to ${status}`);
    
    const transaction = await Transaction.findByPk(transactionId, { transaction: options.transaction });
    if (!transaction) {
      console.log(`Transaction ${transactionId} not found`);
      return null;
    }

    console.log(`Current status of transaction ${transactionId}:`, transaction.xreceipt_status);
    
    const result = await transaction.update({ xreceipt_status: status }, { transaction: options.transaction });
    console.log(`Updated transaction ${transactionId} status to ${status}`);
    console.log('Update result:', result);
    
    // Verify the update
    const updatedTransaction = await Transaction.findByPk(transactionId, { transaction: options.transaction });
    console.log(`Verified status of transaction ${transactionId}:`, updatedTransaction.xreceipt_status);
    
    return updatedTransaction;
  } catch (error) {
    console.error(`Error updating transaction ${transactionId} status:`, error);
    return null;
  }
};

// --- 3. Function to Find Matching Transaction (NEW Revised Version) ---
// Handles nested structure and CR1/CR2/CR3 logic
export const findMatchingTransaction = async (checkData, options = {}) => {
  console.log('Starting transaction matching with data:', JSON.stringify(checkData, null, 2));

  // Create a cache key from the check data
  const cacheKey = JSON.stringify({
    terminalId: checkData.acquirerTerminalId,
    timestamp: checkData.acquirerTransactionTimestamp,
    amount: checkData.transactionAmount?.merchantTransactionAmount,
    currency: checkData.transactionAmount?.merchantTransactionCurrency,
    authCode: checkData.transactionIdentifier?.authorizationCode
  });

  // Try to get from cache first
  const cachedTransaction = transactionCache.get(cacheKey);
  if (cachedTransaction) {
    console.log('Found cached transaction:', cachedTransaction.id);
    return cachedTransaction;
  }

  const primaryWhereClause = {};

  // Acquirer Terminal ID
  if (checkData.acquirerTerminalId) {
    primaryWhereClause.acquirer_terminal_id = checkData.acquirerTerminalId;
    console.log('Using terminal ID:', checkData.acquirerTerminalId);
  } else {
    console.log('Missing terminal ID');
    return null;
  }

  // Acquirer Transaction Timestamp (+/- 60 sekunder)
  if (checkData.acquirerTransactionTimestamp) {
    try {
      const timestamp = new Date(checkData.acquirerTransactionTimestamp);
      if (isNaN(timestamp.getTime())) {
        console.log('Invalid timestamp format:', checkData.acquirerTransactionTimestamp);
        return null;
      }
      const startTime = new Date(timestamp.getTime() - 60000);
      const endTime = new Date(timestamp.getTime() + 60000);
      primaryWhereClause.acquirer_transaction_timestamp = {
        [Op.between]: [startTime, endTime]
      };
      console.log('Using timestamp range:', startTime.toISOString(), 'to', endTime.toISOString());
    } catch (e) {
      console.log('Error processing timestamp:', e);
      return null;
    }
  } else {
    console.log('Missing timestamp');
    return null;
  }

  // Transaction Amount (with tolerance)
  if (checkData.transactionAmount?.merchantTransactionAmount) {
    const amount = parseFloat(checkData.transactionAmount.merchantTransactionAmount);
    if (!isNaN(amount)) {
      const minAmount = (amount - 0.01).toFixed(2);
      const maxAmount = (amount + 0.01).toFixed(2);
      primaryWhereClause.transaction_amount = {
        [Op.between]: [minAmount, maxAmount]
      };
      console.log('Using amount range:', minAmount, 'to', maxAmount);
    } else {
      console.log('Invalid amount format:', checkData.transactionAmount.merchantTransactionAmount);
    }
  } else {
    console.log('Missing amount');
  }

  // Authorization Code
  if (checkData.transactionIdentifier?.authorizationCode) {
    primaryWhereClause.authorization_code = checkData.transactionIdentifier.authorizationCode;
    console.log('Using authorization code:', checkData.transactionIdentifier.authorizationCode);
  } else {
    console.log('Missing authorization code');
  }

  try {
    console.log('Final search criteria:', JSON.stringify(primaryWhereClause, null, 2));
    
    // First, let's check if there are any transactions in the database
    const count = await Transaction.count();
    console.log('Total transactions in database:', count);
    
    const matches = await Transaction.findAll({
      where: primaryWhereClause,
      order: [['acquirer_transaction_timestamp', 'DESC']],
      limit: 1
    });

    if (matches.length > 0) {
      const match = matches[0];
      console.log('Found matching transaction:', match.id);
      console.log('Match details:', {
        terminalId: match.acquirer_terminal_id,
        timestamp: match.acquirer_transaction_timestamp,
        amount: match.transaction_amount,
        authCode: match.authorization_code,
        status: match.xreceipt_status
      });
      
      // Update status to MATCHED
      const updatedTransaction = await updateXReceiptStatus(match.id, 'MATCHED', options);
      console.log('Updated transaction status to MATCHED:', updatedTransaction?.xreceipt_status);
      
      // Cache the result
      transactionCache.set(cacheKey, match);
      
      return match;
    }
    
    console.log('No matching transaction found');
    return null;
  } catch (error) {
    console.error('Error finding matching transaction:', error);
    return null;
  }
};