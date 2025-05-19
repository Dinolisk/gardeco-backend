// src/Models/receiptLineItemModel.js
import { Sequelize, DataTypes } from 'sequelize';
import { sequelize } from '../Database/db.js';

// === Definition av ReceiptLineItem-modellen ===
export const ReceiptLineItem = sequelize.define('ReceiptLineItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  receipt_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  item_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  item_description: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  item_internal_id: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  item_ean: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  quantity: {
    type: DataTypes.DECIMAL(10, 3),
    allowNull: false
  },
  quantity_type: {
    type: DataTypes.STRING(10),
    allowNull: false
  },
  price_incl_vat: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  price_excl_vat: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  vat_rate: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false
  },
  vat_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  discount_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  discount_percentage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true
  },
  discount_description: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  line_total_incl_vat: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  metadata_bundle_group: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  metadata_json: {
    type: DataTypes.JSON,
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
  tableName: 'receipt_line_items',
  timestamps: false
});