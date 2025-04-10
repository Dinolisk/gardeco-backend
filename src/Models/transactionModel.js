import { DataTypes } from 'sequelize';
import { sequelize } from '../Database/db.js';

export const Transaction = sequelize.define('Transaction', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  card_id: {
    type: DataTypes.STRING,
    allowNull: false
  },
  retrieval_reference_number: {
    type: DataTypes.STRING,
    allowNull: false
  },
  acquirer_terminal_id: {
    type: DataTypes.STRING,
    allowNull: false
  },
  card_type: {
    type: DataTypes.STRING,
    allowNull: false
  },
  transaction_amount: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  transaction_currency: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'SEK'
  },
  masked_pan: {
    type: DataTypes.STRING,
    allowNull: false
  },
  merchant_name: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: 'transactions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export const saveTransaction = async (transactionData, cardId) => {
  try {
    const data = {
      card_id: cardId,
      retrieval_reference_number: transactionData.retrievalReferenceNumber,
      acquirer_terminal_id: transactionData.acquirerTerminalId,
      card_type: transactionData.paymentCard?.cardType,
      transaction_amount: transactionData.transactionAmount?.merchantTransactionAmount,
      transaction_currency: transactionData.transactionAmount?.transactionCurrency || 'SEK',
      masked_pan: transactionData.paymentCard?.maskedPan?.[0]?.maskedPanValue,
      merchant_name: transactionData.merchantName
    };
    
    const transaction = await Transaction.create(data);
    return transaction;
  } catch (error) {
    console.error('Error saving transaction:', error);
    throw error;
  }
};
