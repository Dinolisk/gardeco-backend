// src/Models/receiptModel.js
import { Sequelize, DataTypes } from 'sequelize';
import { sequelize } from '../Database/db.js';

// === Uppdaterad Receipt-modell ===
const Receipt = sequelize.define('Receipt', {
  // id: (INTEGER, PK, AI) läggs till automatiskt av Sequelize
  total_amount_incl_vat: {      // Bytte namn från 'total', ändrad typ
    type: DataTypes.DECIMAL(10, 2), // Korrekt typ för belopp
    allowNull: false,
  },
  receipt_number: {             // NY kolumn
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true                // Om du satte UNIQUE i Workbench
  },
  receipt_timestamp: {          // NY kolumn
    type: DataTypes.DATE,       // DATETIME i MySQL mappas till DATE i Sequelize
    allowNull: false,
    // defaultValue: DataTypes.NOW // Kan sättas här om inte DEFAULT CURRENT_TIMESTAMP finns i DB
  },
  total_amount_excl_vat: {      // NY kolumn
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
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
  timestamps: true,             // Använder createdAt och updatedAt automatiskt
  createdAt: 'createdAt',       // Mappa till era kolumnnamn om de skiljer sig
  updatedAt: 'updatedAt'        // t.ex. created_at, updated_at
});

// === Uppdaterad PaymentMethod-modell ===
const PaymentMethod = sequelize.define('PaymentMethod', {
  // id: (INTEGER, PK, AI) läggs till automatiskt av Sequelize
  receipt_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  method: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  label: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  details: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false
  },
  cardType: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  last4: {  // Changed from maskedPan to last4
    type: DataTypes.STRING,
    allowNull: true,
  },
  changeGiven: {  // Added missing field
    type: DataTypes.INTEGER,
    allowNull: true,
  }
}, {
  tableName: 'paymentmethods',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
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