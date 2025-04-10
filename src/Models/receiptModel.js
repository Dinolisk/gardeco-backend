import { Sequelize, DataTypes } from 'sequelize';
import { sequelize } from '../Database/db.js';

// Define Receipt model
const Receipt = sequelize.define('Receipt', {
  total: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});

// Define PaymentMethod model
const PaymentMethod = sequelize.define('PaymentMethod', {
  receipt_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Receipt,
      key: 'id',
    },
  },
  method: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  amount: {
    type: DataTypes.INTEGER,
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
    defaultValue: Sequelize.NOW,
    allowNull: false,
  },
  cardType: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  last4: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  changeGiven: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
});

// Define relationships between models
Receipt.hasMany(PaymentMethod, { foreignKey: 'receipt_id' });
PaymentMethod.belongsTo(Receipt, { foreignKey: 'receipt_id' });

export { Receipt, PaymentMethod };
