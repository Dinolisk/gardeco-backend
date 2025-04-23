import { DataTypes, Op } from 'sequelize';
import { sequelize } from '../Database/db.js';

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
    type: DataTypes.STRING(6), // Specificera längd
    allowNull: false
  },
  system_trace_audit_number: {
    type: DataTypes.STRING(12), // Längd kan variera (6-12 enligt doc)
    allowNull: true  // Conditional field (CR2)
  },
  retrieval_reference_number: {
    type: DataTypes.STRING(12), // Längd kan variera (6-12 enligt doc)
    allowNull: true  // Conditional field (CR2)
  },
  masked_pan: {
    type: DataTypes.STRING, // Längd kan variera
    allowNull: true  // Conditional field (CR2)
  },
  merchant_name: {
    type: DataTypes.STRING, // Max 255 enligt doc
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
    const data = {
      card_id: cardId,
      acquirer_terminal_id: transactionData.acquirerTerminalId,
      acquirer_merchant_id: transactionData.acquirerMerchantId,
      card_type: transactionData.paymentCard?.cardType,
      acquirer_transaction_timestamp: new Date(transactionData.acquirerTransactionTimestamp),
      transaction_amount: transactionData.transactionAmount?.merchantTransactionAmount,
      transaction_currency: transactionData.transactionAmount?.merchantTransactionCurrency,
      authorization_code: transactionData.transactionIdentifier?.authorizationCode,
      system_trace_audit_number: transactionData.transactionIdentifier?.systemTraceAuditNumber,
      retrieval_reference_number: transactionData.transactionIdentifier?.retrievalReferenceNumber,
      masked_pan: Array.isArray(transactionData.paymentCard?.maskedPan) && transactionData.paymentCard.maskedPan.length > 0
        ? transactionData.paymentCard.maskedPan.find(p => p.maskedPanType === 'PRIMARY_PAN')?.maskedPanValue || transactionData.paymentCard.maskedPan[0].maskedPanValue
        : null,
      merchant_name: transactionData.merchantName,
      xreceipt_status: 'PENDING'  // Set initial status
    };

    const transaction = await Transaction.create(data, { transaction: options.transaction });
    return transaction;
  } catch (error) {
    console.error('Error saving transaction:', error);
    throw error;
  }
};

// Add updateXReceiptStatus function
export const updateXReceiptStatus = async (transactionId, status, options = {}) => {
  try {
    const transaction = await Transaction.findByPk(transactionId, { transaction: options.transaction });
    if (!transaction) {
      throw new Error(`Transaction with ID ${transactionId} not found`);
    }

    await transaction.update({ xreceipt_status: status }, { transaction: options.transaction });
    return transaction;
  } catch (error) {
    console.error('Error updating X-Receipt status:', error);
    throw error;
  }
};

// --- 3. Function to Find Matching Transaction (NEW Revised Version) ---
// Handles nested structure and CR1/CR2/CR3 logic
export const findMatchingTransaction = async (checkData, options = {}) => {
  console.log('Starting transaction matching with data:', JSON.stringify(checkData, null, 2)); // Bra för felsökning

  // --- Steg 1: Bygg primär Where-Clause (baserat på "Required" fält i tabellen) ---
  const primaryWhereClause = {};

  // Acquirer Terminal ID
  if (checkData.acquirerTerminalId) {
    primaryWhereClause.acquirer_terminal_id = checkData.acquirerTerminalId;
  } else {
    console.error('Missing required field for matching: acquirerTerminalId');
    return null; // Kan inte matcha utan detta
  }

  // Acquirer Transaction Timestamp (+/- 60 sekunder)
  if (checkData.acquirerTransactionTimestamp) {
    try {
      const timestamp = new Date(checkData.acquirerTransactionTimestamp);
      // Check if timestamp is valid before using getTime
      if (isNaN(timestamp.getTime())) {
          throw new Error('Invalid Date');
      }
      primaryWhereClause.acquirer_transaction_timestamp = {
        [Op.between]: [
          new Date(timestamp.getTime() - 60000), // -60 sekunder
          new Date(timestamp.getTime() + 60000)  // +60 sekunder
        ]
      };
    } catch (e) {
      console.error('Invalid acquirerTransactionTimestamp format:', checkData.acquirerTransactionTimestamp, e);
      return null;
    }
  } else {
    console.error('Missing required field for matching: acquirerTransactionTimestamp');
    return null; // Kan inte matcha utan detta
  }

  // Transaction Amount (Merchant)
  // Use parseFloat to handle potential string numbers and ensure comparison works
  if (checkData.transactionAmount?.merchantTransactionAmount != null) { // Check for null/undefined explicitly
    primaryWhereClause.transaction_amount = parseFloat(checkData.transactionAmount.merchantTransactionAmount);
     if (isNaN(primaryWhereClause.transaction_amount)) {
         console.error('Invalid transactionAmount.merchantTransactionAmount:', checkData.transactionAmount.merchantTransactionAmount);
         return null;
     }
  } else {
    console.error('Missing required field for matching: transactionAmount.merchantTransactionAmount');
    return null; // Kan inte matcha utan detta
  }

  // Transaction Currency (Merchant)
  if (checkData.transactionAmount?.merchantTransactionCurrency) {
    primaryWhereClause.transaction_currency = checkData.transactionAmount.merchantTransactionCurrency;
  } else {
    console.error('Missing required field for matching: transactionAmount.merchantTransactionCurrency');
    return null; // Kan inte matcha utan detta
  }

  // Authorization Code
  if (checkData.transactionIdentifier?.authorizationCode) {
    primaryWhereClause.authorization_code = checkData.transactionIdentifier.authorizationCode;
  } else {
    // Auth code är 'Required' enligt tabellen, kritisk för matchning
    console.error('Missing required field for matching: transactionIdentifier.authorizationCode');
    return null;
  }

  console.log('Primary Where Clause:', primaryWhereClause);

  // --- Steg 2: Hämta *alla* potentiella träffar ---
  let potentialMatches;
  try {
    potentialMatches = await Transaction.findAll({
      where: primaryWhereClause,
      ...options // Viktigt att skicka med transaktionskontext etc.
    });
  } catch (dbError) {
    console.error('Database error during primary match:', dbError);
    throw dbError; // Låt controllern hantera felet
  }

  console.log(`Found ${potentialMatches.length} potential matches based on primary fields.`);

  // --- Steg 3: Hantera Resultat ---
  if (potentialMatches.length === 0) {
    console.log('No match found.');
    return null; // Ingen träff
  }

  if (potentialMatches.length === 1) {
    console.log('Unique match found:', potentialMatches[0].id);
    return potentialMatches[0]; // Exakt en träff, perfekt!
  }

  // --- Steg 4: Flera träffar - Applicera Konditionella Regler (CR1, CR2, CR3) ---
  console.log('Multiple matches found, applying conditional rules...');
  let filteredMatches = [...potentialMatches]; // Kopiera arrayen för filtrering

  // --- CR 1: Acquirer Merchant ID ---
  const acquirerMerchantId = checkData.paymentCard?.acquirerMerchantIds?.acquirerMerchantId;
  if (acquirerMerchantId) {
    console.log(`Applying CR1: Filtering by acquirer_merchant_id=${acquirerMerchantId}`);
    filteredMatches = filteredMatches.filter(
      tx => tx.acquirer_merchant_id === acquirerMerchantId
    );
    console.log(`Matches after CR1: ${filteredMatches.length}`);
    if (filteredMatches.length === 1) return filteredMatches[0];
    if (filteredMatches.length === 0) { console.log('No match after CR1'); return null; }
  }

  // --- CR 2: STAN, RRN, Masked PAN ---
  const stan = checkData.transactionIdentifier?.systemTraceAuditNumber;
  if (stan && filteredMatches.length > 1) {
     console.log(`Applying CR2: Filtering by system_trace_audit_number=${stan}`);
     filteredMatches = filteredMatches.filter(tx => tx.system_trace_audit_number === stan);
     console.log(`Matches after CR2 (STAN): ${filteredMatches.length}`);
     if (filteredMatches.length === 1) return filteredMatches[0];
     if (filteredMatches.length === 0) { console.log('No match after CR2 (STAN)'); return null; }
  }

  const rrn = checkData.transactionIdentifier?.retrievalReferenceNumber;
  if (rrn && filteredMatches.length > 1) {
     console.log(`Applying CR2: Filtering by retrieval_reference_number=${rrn}`);
     filteredMatches = filteredMatches.filter(tx => tx.retrieval_reference_number === rrn);
     console.log(`Matches after CR2 (RRN): ${filteredMatches.length}`);
     if (filteredMatches.length === 1) return filteredMatches[0];
     if (filteredMatches.length === 0) { console.log('No match after CR2 (RRN)'); return null; }
  }

  const maskedPanArray = checkData.paymentCard?.maskedPan;
  const primaryMaskedPan = Array.isArray(maskedPanArray) && maskedPanArray.length > 0
      ? maskedPanArray.find(p => p.maskedPanType === 'PRIMARY_PAN')?.maskedPanValue || maskedPanArray[0].maskedPanValue
      : null;
  if (primaryMaskedPan && filteredMatches.length > 1) {
     console.log(`Applying CR2: Filtering by masked_pan=${primaryMaskedPan}`);
     filteredMatches = filteredMatches.filter(tx => tx.masked_pan === primaryMaskedPan);
     console.log(`Matches after CR2 (Masked PAN): ${filteredMatches.length}`);
     if (filteredMatches.length === 1) return filteredMatches[0];
     if (filteredMatches.length === 0) { console.log('No match after CR2 (Masked PAN)'); return null; }
  }

  // --- CR 3: Card Type ---
  const cardType = checkData.paymentCard?.cardType;
  if (cardType && filteredMatches.length > 1) {
    console.log(`Applying CR3: Filtering by card_type=${cardType}`);
    filteredMatches = filteredMatches.filter(tx => tx.card_type === cardType);
    console.log(`Matches after CR3: ${filteredMatches.length}`);
    if (filteredMatches.length === 1) return filteredMatches[0];
    if (filteredMatches.length === 0) { console.log('No match after CR3'); return null; }
  }

  // --- Steg 5: Hantera Kvarvarande Ambivalens ---
  if (filteredMatches.length > 1) {
    console.warn(`Ambiguous match: ${filteredMatches.length} transactions remain after applying all conditional rules. Returning no match.`);
    return null;
  }

  // --- Final Check ---
  if (filteredMatches.length === 1) {
      return filteredMatches[0];
  } else {
      console.log('Final check resulted in no match.');
      return null;
  }
};