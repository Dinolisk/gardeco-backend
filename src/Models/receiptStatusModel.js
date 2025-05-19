import { DataTypes } from 'sequelize';
import { sequelize } from '../Database/db.js';

export const ReceiptStatus = sequelize.define('ReceiptStatus', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  transaction_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'transactions',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM(
      'CREATED',           // När kvittot först skapas
      'MATCHED',           // När det matchas med en transaktion
      'PENDING',           // Väntar på att skickas till XReceipts
      'SENT',             // Skickat till XReceipts
      'CONFIRMED',        // Bekräftat av XReceipts
      'ERROR',            // Ett fel uppstod
      'RETRY',            // Försöker skicka igen
      'CANCELLED'         // Avbrutet
    ),
    allowNull: false
  },
  error_message: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  error_code: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  retry_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  last_retry_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Additional status-specific information'
  }
}, {
  tableName: 'receipt_statuses',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Helper function to create a new status entry
export const createStatusEntry = async (transactionId, status, options = {}) => {
  try {
    const statusEntry = await ReceiptStatus.create({
      transaction_id: transactionId,
      status: status
    }, options);
    
    return statusEntry;
  } catch (error) {
    console.error('Error creating status entry:', error);
    throw error;
  }
};

// Helper function to update status with error information
export const updateStatusWithError = async (transactionId, status, errorMessage, errorCode = null, options = {}) => {
  try {
    const statusEntry = await ReceiptStatus.create({
      transaction_id: transactionId,
      status: status,
      error_message: errorMessage,
      error_code: errorCode,
      retry_count: 1,
      last_retry_at: new Date()
    }, options);
    
    return statusEntry;
  } catch (error) {
    console.error('Error updating status with error:', error);
    throw error;
  }
};

// Helper function to increment retry count
export const incrementRetryCount = async (transactionId, options = {}) => {
  try {
    const statusEntry = await ReceiptStatus.findOne({
      where: { transaction_id: transactionId },
      order: [['created_at', 'DESC']]
    }, options);

    if (statusEntry) {
      await statusEntry.update({
        retry_count: statusEntry.retry_count + 1,
        last_retry_at: new Date()
      }, options);
    }

    return statusEntry;
  } catch (error) {
    console.error('Error incrementing retry count:', error);
    throw error;
  }
}; 