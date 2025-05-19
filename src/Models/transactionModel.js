import { DataTypes, Op } from 'sequelize';
import { sequelize } from '../Database/db.js';
import NodeCache from 'node-cache';
import { Sequelize } from 'sequelize';

// Create a cache with 5 minutes TTL
const transactionCache = new NodeCache({ stdTTL: 300 });

// Helper function to format price
const formatPrice = (price) => {
  if (typeof price === 'string') {
    return parseFloat(price).toFixed(2);
  }
  return price.toFixed(2);
};

// Format UUIDs to ensure they are valid UUID v4
const formatUUID = (uuid) => {
  if (!uuid) return null;
  // If UUID is already in correct format, return it as is
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(uuid.toLowerCase())) {
    return uuid.toLowerCase();
  }
  // Otherwise, format it
  const cleaned = uuid.replace(/[^0-9a-fA-F]/g, '');
  // Check if we have exactly 32 characters
  if (cleaned.length !== 32) {
    console.log('Invalid UUID length:', cleaned.length);
    return null;
  }
  // Format as UUID v4
  const formatted = [
    cleaned.slice(0, 8),
    cleaned.slice(8, 12),
    '4' + cleaned.slice(13, 16),
    '8' + cleaned.slice(17, 20),
    cleaned.slice(20)
  ].join('-').toLowerCase();
  console.log('UUID formatting:', {
    original: uuid,
    cleaned,
    formatted,
    isValid: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(formatted)
  });
  return formatted;
};

// --- 1. Model Definition ---
export const Transaction = sequelize.define('Transaction', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  schema_version: {
    type: DataTypes.STRING(10),
    allowNull: false,
    validate: {
      is: /^V\d+\.\d+$/
    }
  },
  card_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  cashier_system_id: {
    type: DataTypes.STRING(9),
    allowNull: false,
    validate: {
      is: /^\d{9}$/
    }
  },
  round_trip_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  cardholder_reference: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  acquirer_terminal_id: {
    type: DataTypes.STRING(15),
    allowNull: false,
    validate: {
      len: [1, 15]
    }
  },
  acquirer_merchant_id: {
    type: DataTypes.STRING(15),
    allowNull: true,
    validate: {
      len: [1, 15]
    }
  },
  card_type: {
    type: DataTypes.ENUM(
      'BANKAXEPT',
      'VISA',
      'MASTERCARD',
      'DINERS',
      'AMERICAN_EXPRESS',
      'DISCOVER',
      'JCB',
      'UNIONPAY',
      'MAESTRO',
      'UNKNOWN'
    ),
    allowNull: false
  },
  acquirer_transaction_timestamp: {
    type: DataTypes.DATE,
    allowNull: false
  },
  payment: {
    type: DataTypes.JSON,
    allowNull: false,
    validate: {
      isValidPayment(value) {
        if (!value || typeof value !== 'object') {
          throw new Error('payment must be an object');
        }
        if (!value.merchantTransactionAmount || parseFloat(value.merchantTransactionAmount) === 0) {
          throw new Error('merchantTransactionAmount is required and cannot be zero');
        }
        if (!value.merchantTransactionCurrency || !/^[A-Z]{3}$/.test(value.merchantTransactionCurrency)) {
          throw new Error('merchantTransactionCurrency must be a valid 3-letter currency code');
        }
      }
    }
  },
  authorization_code: {
    type: DataTypes.STRING(6),
    allowNull: false,
    validate: {
      is: /^\d{6}$/
    }
  },
  system_trace_audit_number: {
    type: DataTypes.STRING(12),
    allowNull: true,
    validate: {
      is: /^\d{6,12}$/
    }
  },
  retrieval_reference_number: {
    type: DataTypes.STRING(12),
    allowNull: true,
    validate: {
      is: /^\d{6,12}$/
    }
  },
  transaction_reference: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  masked_pan: {
    type: DataTypes.STRING(19),
    allowNull: true,
    validate: {
      is: /^[*\d]{8,19}$/
    }
  },
  merchant_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  cardholder_consents: {
    type: DataTypes.JSON,
    allowNull: true,
    validate: {
      isValidConsents(value) {
        if (value && !Array.isArray(value)) {
          throw new Error('cardholder_consents must be an array');
        }
        if (value) {
          value.forEach(consent => {
            if (!consent.consentId || !consent.consentType || typeof consent.consentStatus !== 'boolean') {
              throw new Error('Invalid consent format');
            }
          });
        }
      }
    }
  },
  cardholder_memberships: {
    type: DataTypes.JSON,
    allowNull: true,
    validate: {
      isValidMemberships(value) {
        if (value && !Array.isArray(value)) {
          throw new Error('cardholder_memberships must be an array');
        }
        if (value) {
          value.forEach(membership => {
            if (!membership.memberValue || !membership.memberValueType || !membership.memberValueProvider) {
              throw new Error('Invalid membership format');
            }
          });
        }
      }
    }
  },
  xreceipts: {
    type: DataTypes.JSON,
    allowNull: false,
    validate: {
      isValidXReceipts(value) {
        if (!value || typeof value !== 'object') {
          throw new Error('xreceipts must be an object');
        }
        if (!value.clientId || !/^\d{9}$/.test(value.clientId)) {
          throw new Error('xreceipts must have a valid clientId');
        }
        if (!value.roundTripId) {
          throw new Error('xreceipts must have a roundTripId');
        }
      }
    }
  },
  line_items: {
    type: DataTypes.JSON,
    allowNull: false,
    validate: {
      isValidLineItems(value) {
        if (!Array.isArray(value)) {
          throw new Error('line_items must be an array');
        }
        if (value.length === 0) {
          throw new Error('line_items cannot be empty');
        }
        value.forEach(item => {
          // Validate required fields
          if (!item.itemName || !item.itemPrice || !item.itemQuantity) {
            throw new Error('Missing required fields in line item');
          }
          
          // Validate itemMetadata if present
          if (item.itemMetadata) {
            if (typeof item.itemMetadata !== 'object') {
              throw new Error('itemMetadata must be an object');
            }
            if (!item.itemMetadata.key || typeof item.itemMetadata.key !== 'string') {
              throw new Error('itemMetadata must have a non-empty string key');
            }
            if (typeof item.itemMetadata.value !== 'string') {
              throw new Error('itemMetadata must have a string value');
            }
          }

          // Validate itemMetadataList if present
          if (item.itemMetadataList) {
            if (!Array.isArray(item.itemMetadataList)) {
              throw new Error('itemMetadataList must be an array');
            }
            item.itemMetadataList.forEach(metadata => {
              if (!metadata.key || typeof metadata.key !== 'string') {
                throw new Error('itemMetadataList items must have a non-empty string key');
              }
              if (typeof metadata.value !== 'string') {
                throw new Error('itemMetadataList items must have a string value');
              }
            });
          }
        });
      }
    }
  },
  order_summary: {
    type: DataTypes.JSON,
    allowNull: false,
    validate: {
      isValidOrderSummary(value) {
        if (!value.currencyIsoCode || !value.totalAmountIncVat || !value.totalAmountExcVat) {
          throw new Error('Missing required fields in order_summary');
        }
        if (!Array.isArray(value.vatSummary)) {
          throw new Error('vatSummary must be an array');
        }
      }
    }
  },
  xreceipt_status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'PENDING'
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
    console.log('Raw transactionData type:', typeof transactionData);
    console.log('Raw transactionData:', JSON.stringify(transactionData, null, 2));

    // Extract schemaVersion from the original string if it exists
    let schemaVersion;
    if (typeof transactionData === 'object' && typeof transactionData.transactionData === 'string') {
      try {
        const parsedString = JSON.parse(transactionData.transactionData);
        schemaVersion = parsedString.schemaVersion;
        console.log('Found schemaVersion in original string:', schemaVersion);
      } catch (e) {
        console.log('Error parsing transactionData string:', e);
      }
    }

    // Parse the transactionData string if it exists
    let parsedData;
    if (typeof transactionData === 'object' && typeof transactionData.transactionData === 'string') {
      // If transactionData is a string inside an object
      parsedData = JSON.parse(transactionData.transactionData);
      console.log('Parsed transactionData string:', JSON.stringify(parsedData, null, 2));
    } else if (typeof transactionData === 'string') {
      // If transactionData is directly a string
      parsedData = JSON.parse(transactionData);
      console.log('Parsed transactionData string:', JSON.stringify(parsedData, null, 2));
    } else if (typeof transactionData === 'object' && transactionData.transactionData) {
      // If transactionData is an object with a transactionData property
      parsedData = transactionData.transactionData;
      console.log('Using transactionData object:', JSON.stringify(parsedData, null, 2));
    } else {
      // If transactionData is already an object
      parsedData = transactionData;
      console.log('Using transactionData directly:', JSON.stringify(parsedData, null, 2));
    }

    // Ensure schemaVersion is preserved
    if (schemaVersion) {
      parsedData.schemaVersion = schemaVersion;
      console.log('Added schemaVersion to parsed data:', schemaVersion);
    }

    // Extract line_items and order_summary from the correct location
    const lineItems = parsedData.line_items || parsedData.xReceipts?.lineItems || [];
    const orderSummary = parsedData.order_summary || parsedData.xReceipts?.orderSummary || {};

    console.log('Extracted line_items and order_summary:', {
      lineItems,
      orderSummary,
      source: {
        hasLineItems: Boolean(parsedData.line_items),
        hasXReceiptsLineItems: Boolean(parsedData.xReceipts?.lineItems),
        hasOrderSummary: Boolean(parsedData.order_summary),
        hasXReceiptsOrderSummary: Boolean(parsedData.xReceipts?.orderSummary)
      }
    });

    // Validate required fields first
    const requiredFields = {
      'schemaVersion': parsedData.schemaVersion,
      'xReceipts.clientId': parsedData.xReceipts?.clientId,
      'xReceipts.roundTripId': parsedData.xReceipts?.roundTripId,
      'merchantName': parsedData.merchantName,
      'acquirerTerminalId': parsedData.acquirerTerminalId,
      'acquirerTransactionTimestamp': parsedData.acquirerTransactionTimestamp,
      'transactionAmount.merchantTransactionAmount': parsedData.transactionAmount?.merchantTransactionAmount,
      'transactionAmount.merchantTransactionCurrency': parsedData.transactionAmount?.merchantTransactionCurrency,
      'transactionIdentifier.authorizationCode': parsedData.transactionIdentifier?.authorizationCode,
      'paymentCard.cardType': parsedData.paymentCard?.cardType,
      'paymentCard.maskedPan': parsedData.paymentCard?.maskedPan
    };

    console.log('Required fields check:', JSON.stringify(requiredFields, null, 2));

    const missingFields = Object.entries(requiredFields)
      .filter(([_, value]) => value == null)
      .map(([key]) => key);

    if (missingFields.length > 0) {
      console.log('Missing fields:', missingFields);
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Validate schema version format
    if (!/^V\d+\.\d+$/.test(parsedData.schemaVersion)) {
      throw new Error('Invalid schema version format');
    }

    // Validate client ID format
    if (!/^\d{9}$/.test(parsedData.xReceipts.clientId)) {
      throw new Error('Invalid client ID format');
    }

    // Validate UUID formats
    if (parsedData.xReceipts.roundTripId && !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(parsedData.xReceipts.roundTripId)) {
      throw new Error('Invalid roundTripId format');
    }

    // Validate cardId format if provided
    if (cardId) {
      const formattedCardId = formatUUID(cardId);
      if (!formattedCardId) {
        throw new Error('Invalid cardId format');
      }
    }

    // Validate currency format
    if (!/^[A-Z]{3}$/.test(parsedData.transactionAmount.merchantTransactionCurrency)) {
      throw new Error('Invalid merchant transaction currency format');
    }
    if (parsedData.transactionAmount.cardholderTransactionCurrency && 
        !/^[A-Z]{3}$/.test(parsedData.transactionAmount.cardholderTransactionCurrency)) {
      throw new Error('Invalid cardholder transaction currency format');
    }

    // Validate card type
    const validCardTypes = [
      'BANKAXEPT', 'VISA', 'MASTERCARD', 'DINERS', 'AMERICAN_EXPRESS',
      'DISCOVER', 'JCB', 'UNIONPAY', 'MAESTRO', 'UNKNOWN'
    ];
    if (!validCardTypes.includes(parsedData.paymentCard.cardType)) {
      throw new Error('Invalid card type');
    }

    const formattedCardId = cardId ? formatUUID(cardId) : null;
    const formattedRoundTripId = formatUUID(parsedData.xReceipts.roundTripId) || formatUUID(cardId);

    // Add detailed logging of UUID formatting
    console.log('UUID Formatting Details:', {
      originalCardId: cardId,
      formattedCardId,
      originalRoundTripId: parsedData.xReceipts.roundTripId,
      formattedRoundTripId,
      validation: {
        cardId: {
          isValid: Boolean(formattedCardId),
          matches: formattedCardId === cardId?.toLowerCase()
        },
        roundTripId: {
          isValid: Boolean(formattedRoundTripId),
          matches: formattedRoundTripId === parsedData.xReceipts.roundTripId?.toLowerCase()
        }
      }
    });

    // Prepare transaction data
    const transactionRecord = {
      schema_version: parsedData.schemaVersion,
      card_id: formattedCardId,
      cashier_system_id: parsedData.xReceipts.clientId,
      round_trip_id: formattedRoundTripId,
      cardholder_reference: parsedData.cardholderReference || parsedData.xReceipts.cardholderReference,
      acquirer_terminal_id: parsedData.acquirerTerminalId,
      acquirer_merchant_id: parsedData.paymentCard.acquirerMerchantIds?.acquirerMerchantId,
      card_type: parsedData.paymentCard.cardType,
      acquirer_transaction_timestamp: new Date(parsedData.acquirerTransactionTimestamp),
      payment: parsedData.transactionAmount,
      authorization_code: parsedData.transactionIdentifier.authorizationCode,
      system_trace_audit_number: parsedData.transactionIdentifier.systemTraceAuditNumber,
      retrieval_reference_number: parsedData.transactionIdentifier.retrievalReferenceNumber,
      transaction_reference: parsedData.transactionIdentifier.transactionReference,
      masked_pan: parsedData.paymentCard.maskedPan[0]?.maskedPanValue,
      merchant_name: parsedData.merchantName,
      cardholder_consents: parsedData.xReceipts.cardholderConsents,
      cardholder_memberships: parsedData.xReceipts.cardholderMemberships,
      xreceipts: parsedData.xReceipts,
      line_items: lineItems.length > 0 ? lineItems : [{
        itemName: "Default Item",
        itemPrice: parsedData.transactionAmount.merchantTransactionAmount,
        itemQuantity: 1,
        itemMetadata: {
          key: "type",
          value: "default"
        }
      }],
      order_summary: Object.keys(orderSummary).length > 0 ? orderSummary : {
        currencyIsoCode: parsedData.transactionAmount.merchantTransactionCurrency,
        totalAmountIncVat: parsedData.transactionAmount.merchantTransactionAmount,
        totalAmountExcVat: (parseFloat(parsedData.transactionAmount.merchantTransactionAmount) * 0.8).toFixed(2),
        vatSummary: [{
          vatRate: "25",
          vatAmount: (parseFloat(parsedData.transactionAmount.merchantTransactionAmount) * 0.2).toFixed(2)
        }]
      }
    };

    // Add detailed logging of the transactionRecord
    console.log('Transaction record before create:', {
      card_id: {
        value: transactionRecord.card_id,
        type: typeof transactionRecord.card_id
      },
      round_trip_id: {
        value: transactionRecord.round_trip_id,
        type: typeof transactionRecord.round_trip_id
      },
      line_items: {
        value: transactionRecord.line_items,
        length: transactionRecord.line_items.length,
        firstItem: transactionRecord.line_items[0]
      },
      order_summary: {
        value: transactionRecord.order_summary,
        hasRequiredFields: Boolean(
          transactionRecord.order_summary?.currencyIsoCode &&
          transactionRecord.order_summary?.totalAmountIncVat &&
          transactionRecord.order_summary?.totalAmountExcVat &&
          Array.isArray(transactionRecord.order_summary?.vatSummary)
        ),
        fields: Object.keys(transactionRecord.order_summary)
      }
    });

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
  let startTime, endTime, minAmount, maxAmount;

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
      startTime = new Date(utcTimestamp.getTime() - 60000);
      endTime = new Date(utcTimestamp.getTime() + 60000);
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
      minAmount = (amount - 0.01).toFixed(2);
      maxAmount = (amount + 0.01).toFixed(2);
      primaryWhereClause.payment = {
        [Op.and]: [
          Sequelize.literal(`JSON_EXTRACT(payment, '$.merchantTransactionAmount') BETWEEN ${minAmount} AND ${maxAmount}`)
        ]
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
    
    const matchingTransaction = await Transaction.findOne({
      where: primaryWhereClause,
      order: [['acquirer_transaction_timestamp', 'DESC']]
    });

    if (matchingTransaction) {
      console.log('Found matching transaction:', matchingTransaction.id);
      console.log('Match details:', {
        terminalId: matchingTransaction.acquirer_terminal_id,
        timestamp: matchingTransaction.acquirer_transaction_timestamp,
        amount: matchingTransaction.payment?.merchantTransactionAmount,
        authCode: matchingTransaction.authorization_code,
        status: matchingTransaction.xreceipt_status
      });
      
      // Update status to MATCHED
      const updatedTransaction = await updateXReceiptStatus(matchingTransaction.id, 'MATCHED', options);
      console.log('Updated transaction status to MATCHED:', updatedTransaction?.xreceipt_status);
      
      // Cache the result
      transactionCache.set(cacheKey, updatedTransaction);
      return updatedTransaction;
    }
    console.log('No matching transaction found');
    return null;
  } catch (error) {
    console.error('Error finding matching transaction:', error);
    return null;
  }
};