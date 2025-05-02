import { DataTypes, Op } from 'sequelize';
import { sequelize } from '../Database/db.js';
import NodeCache from 'node-cache';

// Create a cache with 5 minutes TTL
const transactionCache = new NodeCache({ stdTTL: 300 });

// Helper function to format price
const formatPrice = (price) => {
  if (typeof price === 'string') {
    return parseFloat(price).toFixed(2);
  }
  return price.toFixed(2);
};

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
    allowNull: false
  },
  // X-Receipts specific fields
  schema_version: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: '1.0'
  },
  cashier_system_id: {
    type: DataTypes.STRING(9),
    allowNull: false
  },
  round_trip_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  cardholder_reference: {
    type: DataTypes.UUID,
    allowNull: false
  },
  general_information: {
    type: DataTypes.JSON,
    allowNull: false,
    get() {
      const rawValue = this.getDataValue('general_information');
      if (!rawValue) return null;
      return JSON.parse(rawValue);
    },
    set(value) {
      if (value) {
        this.setDataValue('general_information', JSON.stringify(value));
      } else {
        this.setDataValue('general_information', null);
      }
    }
  },
  merchant: {
    type: DataTypes.JSON,
    allowNull: false,
    get() {
      const rawValue = this.getDataValue('merchant');
      if (!rawValue) return null;
      return JSON.parse(rawValue);
    },
    set(value) {
      if (value) {
        this.setDataValue('merchant', JSON.stringify(value));
      } else {
        this.setDataValue('merchant', null);
      }
    }
  },
  branch: {
    type: DataTypes.JSON,
    allowNull: false,
    get() {
      const rawValue = this.getDataValue('branch');
      if (!rawValue) return null;
      return JSON.parse(rawValue);
    },
    set(value) {
      if (value) {
        this.setDataValue('branch', JSON.stringify(value));
      } else {
        this.setDataValue('branch', null);
      }
    }
  },
  line_items: {
    type: DataTypes.JSON,
    allowNull: false,
    get() {
      const rawValue = this.getDataValue('line_items');
      if (!rawValue) return null;
      return JSON.parse(rawValue);
    },
    set(value) {
      if (value) {
        // Format prices in line items
        const formattedValue = value.map(item => ({
          ...item,
          itemPrice: {
            ...item.itemPrice,
            priceIncVat: formatPrice(item.itemPrice.priceIncVat),
            priceExcVat: formatPrice(item.itemPrice.priceExcVat),
            vatAmount: formatPrice(item.itemPrice.vatAmount)
          },
          itemSumTotal: formatPrice(item.itemSumTotal),
          itemIds: {
            ...item.itemIds,
            id: item.itemIds?.id || item.itemId || 'N/A'
          }
        }));
        this.setDataValue('line_items', JSON.stringify(formattedValue));
      } else {
        this.setDataValue('line_items', null);
      }
    }
  },
  order_summary: {
    type: DataTypes.JSON,
    allowNull: false,
    get() {
      const rawValue = this.getDataValue('order_summary');
      if (!rawValue) return null;
      return JSON.parse(rawValue);
    },
    set(value) {
      if (value) {
        // Format prices in order summary
        const formattedValue = {
          ...value,
          totalAmountIncVat: formatPrice(value.totalAmountIncVat),
          totalAmountExcVat: formatPrice(value.totalAmountExcVat)
        };
        this.setDataValue('order_summary', JSON.stringify(formattedValue));
      } else {
        this.setDataValue('order_summary', null);
      }
    }
  },
  payment: {
    type: DataTypes.JSON,
    allowNull: false,
    get() {
      const rawValue = this.getDataValue('payment');
      if (!rawValue) return null;
      return JSON.parse(rawValue);
    },
    set(value) {
      if (value) {
        this.setDataValue('payment', JSON.stringify(value));
      } else {
        this.setDataValue('payment', null);
      }
    }
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
    // Validate required fields first
    const requiredFields = {
      'xReceipts.schemaVersion': transactionData.xReceipts?.schemaVersion,
      'xReceipts.cashierSystemId': transactionData.xReceipts?.cashierSystemId,
      'xReceipts.roundTripId': transactionData.xReceipts?.roundTripId,
      'xReceipts.cardholderReference': transactionData.xReceipts?.cardholderReference,
      'xReceipts.generalInformation': transactionData.xReceipts?.generalInformation,
      'xReceipts.merchant': transactionData.xReceipts?.merchant,
      'xReceipts.branch': transactionData.xReceipts?.branch,
      'xReceipts.lineItems': transactionData.xReceipts?.lineItems,
      'xReceipts.orderSummary': transactionData.xReceipts?.orderSummary,
      'xReceipts.payment': transactionData.xReceipts?.payment
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([_, value]) => value == null)
      .map(([key]) => key);

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Prepare transaction data
    const transactionRecord = {
      card_id: cardId,
      schema_version: transactionData.xReceipts.schemaVersion,
      cashier_system_id: transactionData.xReceipts.cashierSystemId,
      round_trip_id: transactionData.xReceipts.roundTripId,
      cardholder_reference: transactionData.xReceipts.cardholderReference,
      general_information: transactionData.xReceipts.generalInformation,
      merchant: transactionData.xReceipts.merchant,
      branch: transactionData.xReceipts.branch,
      line_items: transactionData.xReceipts.lineItems,
      order_summary: transactionData.xReceipts.orderSummary,
      payment: transactionData.xReceipts.payment,
      // Extract payment details from the first payment method
      acquirer_terminal_id: transactionData.xReceipts.payment[0]?.acquirerTerminalId,
      acquirer_merchant_id: transactionData.xReceipts.payment[0]?.acquirerMerchantId,
      card_type: transactionData.xReceipts.payment[0]?.cardType,
      acquirer_transaction_timestamp: new Date(transactionData.xReceipts.payment[0]?.acquirerTransactionTimestamp),
      transaction_amount: transactionData.xReceipts.payment[0]?.transactionAmount?.merchantTransactionAmount,
      transaction_currency: transactionData.xReceipts.payment[0]?.transactionAmount?.merchantTransactionCurrency,
      authorization_code: transactionData.xReceipts.payment[0]?.transactionIdentifier?.authorizationCode,
      system_trace_audit_number: transactionData.xReceipts.payment[0]?.transactionIdentifier?.systemTraceAuditNumber,
      retrieval_reference_number: transactionData.xReceipts.payment[0]?.transactionIdentifier?.retrievalReferenceNumber,
      masked_pan: transactionData.xReceipts.payment[0]?.maskedPan,
      merchant_name: transactionData.xReceipts.merchant?.merchantName
    };

    // Create transaction
    const transaction = await Transaction.create(transactionRecord, {
      ...options,
      transaction: options.transaction
    });

    return transaction;
  } catch (error) {
    console.error('Error saving transaction:', error);
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
      
      // Ensure timestamp is in UTC
      const utcTimestamp = new Date(Date.UTC(
        timestamp.getUTCFullYear(),
        timestamp.getUTCMonth(),
        timestamp.getUTCDate(),
        timestamp.getUTCHours(),
        timestamp.getUTCMinutes(),
        timestamp.getUTCSeconds(),
        timestamp.getUTCMilliseconds()
      ));
      
      const startTime = new Date(utcTimestamp.getTime() - 60000);
      const endTime = new Date(utcTimestamp.getTime() + 60000);
      
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
      return null;
    }
  } else {
    console.log('Missing amount');
    return null;
  }

  // Authorization Code
  if (checkData.transactionIdentifier?.authorizationCode) {
    primaryWhereClause.authorization_code = checkData.transactionIdentifier.authorizationCode;
    console.log('Using authorization code:', checkData.transactionIdentifier.authorizationCode);
  } else {
    console.log('Missing authorization code');
    return null;
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