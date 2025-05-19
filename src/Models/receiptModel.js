// src/Models/receiptModel.js
import { Sequelize, DataTypes } from 'sequelize';
import { sequelize } from '../Database/db.js';

// === Uppdaterad Receipt-modell ===
const Receipt = sequelize.define('Receipt', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  total_amount_incl_vat: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  receipt_number: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  receipt_timestamp: {
    type: DataTypes.DATE,
    allowNull: false
  },
  total_amount_excl_vat: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  currency_iso_code: {          // NY kolumn
    type: DataTypes.STRING(3),
    allowNull: false,
  },
  transaction_id: {             // NY kolumn (för FK)
    type: DataTypes.INTEGER,
    allowNull: true,            // Tillåt NULL som diskuterat
  },
  vat_summary: {                // NY kolumn
    type: DataTypes.JSON,
    allowNull: true
  },
}, {
  tableName: 'receipts',
  timestamps: false
});

// === Uppdaterad PaymentMethod-modell ===
const PaymentMethod = sequelize.define('PaymentMethod', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  receipt_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  method: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  label: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  details: {
    type: DataTypes.JSON,
    allowNull: true
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false
  },
  cardType: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  last4: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  changeGiven: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  tableName: 'paymentmethods',
  timestamps: false
});

// Add associations
Receipt.hasMany(PaymentMethod, {
  foreignKey: 'receipt_id',
  as: 'paymentMethods'
});

PaymentMethod.belongsTo(Receipt, {
  foreignKey: 'receipt_id',
  as: 'receipt'
});

export { Receipt, PaymentMethod };