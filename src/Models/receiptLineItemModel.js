// src/Models/receiptLineItemModel.js
import { Sequelize, DataTypes } from 'sequelize';
import { sequelize } from '../Database/db.js';
import { Receipt } from './receiptModel.js'; // Importera Receipt för relationen

// === Definition av ReceiptLineItem-modellen ===
export const ReceiptLineItem = sequelize.define('ReceiptLineItem', {
  // id: (INTEGER, PK, AI) läggs till automatiskt
  receipt_id: {                   // Foreign Key till receipts-tabellen
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {               // Definiera FK-referens här (eller bara via association)
      model: Receipt,
      key: 'id'
    }
  },
  item_name: {                  // Motsvarar itemName
    type: DataTypes.STRING,     // Använd lämplig längd, t.ex. VARCHAR(255) i DB
    allowNull: false
  },
  item_description: {           // Motsvarar itemDescription (valfri)
    type: DataTypes.STRING,     // Kanske längre, TEXT i DB?
    allowNull: true
  },
  item_internal_id: {           // Motsvarar itemIds.id (valfri)
    type: DataTypes.STRING,
    allowNull: true
  },
  item_ean: {                   // Motsvarar itemIds.ean (valfri)
    type: DataTypes.STRING,     // Vanligtvis VARCHAR(13) eller liknande
    allowNull: true
  },
  quantity: {                   // Motsvarar itemQuantity.quantity
    type: DataTypes.DECIMAL(10, 3), // Tillåt 3 decimaler för t.ex. KG
    allowNull: false
  },
  quantity_type: {              // Motsvarar itemQuantity.type
    type: DataTypes.STRING(10),   // t.ex. 'PCS', 'KG', 'LITER'
    allowNull: false
  },
  price_incl_vat: {             // Motsvarar itemPrice.priceIncVat
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  price_excl_vat: {             // Motsvarar itemPrice.priceExcVat
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  vat_rate: {                   // Motsvarar itemPrice.vatRate (procent)
    type: DataTypes.DECIMAL(5, 2), // t.ex. 25.00
    allowNull: false
  },
  vat_amount: {                 // Motsvarar itemPrice.vatAmount (uträknat belopp)
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  discount_amount: {            // Motsvarar itemDiscount.amount (valfri)
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  discount_percentage: {        // Motsvarar itemDiscount.percentage (valfri)
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true
  },
  discount_description: {       // Motsvarar itemDiscount.description (valfri)
    type: DataTypes.STRING,
    allowNull: true
  },
  line_total_incl_vat: {        // Motsvarar itemSumTotal
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  metadata_bundle_group: {      // För att stödja Bundle Items (valfri)
    type: DataTypes.STRING,
    allowNull: true
  },
  metadata_json: {              // För annan öppen metadata om det behövs (valfri)
    type: DataTypes.JSON,
    allowNull: true
  }
  // createdAt och updatedAt sköts av timestamps: true
}, {
  tableName: 'receipt_line_items', // Namnet på er databastabell
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
});

// === Definiera Relationer ===
// En Varupost (ReceiptLineItem) hör till ett Kvitto (Receipt)
ReceiptLineItem.belongsTo(Receipt, {
  foreignKey: {
    name: 'receipt_id', // Kolumnen i ReceiptLineItem
    allowNull: false
  }
});

// Kom ihåg att lägga till den motsatta relationen i receiptModel.js:
// Receipt.hasMany(ReceiptLineItem, { foreignKey: 'receipt_id', as: 'lineItems' });

// === Exportera Modellen ===
// (Ingen export behövs här om ni skapar en index.js för modeller,
// annars exportera den så den kan importeras där den behövs)
// export { ReceiptLineItem }; // Avkommentera om ni inte har en central model-index.js