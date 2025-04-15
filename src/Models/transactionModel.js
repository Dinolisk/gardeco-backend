import { DataTypes, Op } from 'sequelize';
import { sequelize } from '../Database/db.js';

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
    allowNull: false
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
    type: DataTypes.STRING,
    allowNull: false
  },
  authorization_code: {
    type: DataTypes.STRING,
    allowNull: false
  },
  system_trace_audit_number: {
    type: DataTypes.STRING,
    allowNull: true  // Conditional field (CR2)
  },
  retrieval_reference_number: {
    type: DataTypes.STRING,
    allowNull: true  // Conditional field (CR2)
  },
  masked_pan: {
    type: DataTypes.STRING,
    allowNull: true  // Conditional field (CR2)
  },
  merchant_name: {
    type: DataTypes.STRING,
    allowNull: true  // Conditional field
  }
}, {
  tableName: 'transactions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export const saveTransaction = async (transactionData, cardId = null) => {
  try {
    const data = {
      card_id: cardId,
      acquirer_terminal_id: transactionData.acquirerTerminalId,
      acquirer_merchant_id: transactionData.acquirerMerchantId,
      card_type: transactionData.paymentCard?.cardType,
      acquirer_transaction_timestamp: new Date(transactionData.timestamp),
      transaction_amount: transactionData.transactionAmount?.merchantTransactionAmount,
      transaction_currency: transactionData.transactionAmount?.transactionCurrency,
      authorization_code: transactionData.authorizationCode,
      system_trace_audit_number: transactionData.systemTraceAuditNumber,
      retrieval_reference_number: transactionData.retrievalReferenceNumber,
      masked_pan: Array.isArray(transactionData.paymentCard?.maskedPan) && transactionData.paymentCard.maskedPan.length > 0
        ? transactionData.paymentCard.maskedPan[0].maskedPanValue
        : null,
      merchant_name: transactionData.merchantName
    };
    
    const transaction = await Transaction.create(data);
    return transaction;
  } catch (error) {
    console.error('Error saving transaction:', error);
    throw error;
  }
};

// Function to find matching transaction based on Transaction Check Request
export const findMatchingTransaction = async (checkData, options = {}) => {
  const whereClause = {
    acquirer_terminal_id: checkData.AcquirerTerminalId,
    card_type: checkData.cardType,
    transaction_amount: checkData.TransactionAmount,
    transaction_currency: checkData.TransactionCurrency,
    authorization_code: checkData.AuthorizationCode,
  acquirer_transaction_timestamp: {
    [Op.between]: [
      new Date(new Date(checkData.AcquirerTransactionTimestamp).getTime() - 60000), // -60 seconds
      new Date(new Date(checkData.AcquirerTransactionTimestamp).getTime() + 60000)  // +60 seconds
    ]
  }
  };

  // Add conditional fields if present
  if (checkData.AcquirerMerchantId) {
    whereClause.acquirer_merchant_id = checkData.AcquirerMerchantId;
  }
  if (checkData.SystemTraceAuditNumber) {
    whereClause.system_trace_audit_number = checkData.SystemTraceAuditNumber;
  }
  if (checkData.RetrievalReferenceNumber) {
    whereClause.retrieval_reference_number = checkData.RetrievalReferenceNumber;
  }
  if (checkData.MaskedPan) {
    whereClause.masked_pan = checkData.MaskedPan;
  }

  return Transaction.findOne({
    where: whereClause,
    ...options
  });
};
