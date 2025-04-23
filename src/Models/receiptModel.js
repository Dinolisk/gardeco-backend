// src/Models/receiptModel.js
import { Sequelize, DataTypes } from 'sequelize';
import { sequelize } from '../Database/db.js';
import { ReceiptLineItem } from './receiptLineItemModel.js'; 
// Importera andra modeller här om relationer ska definieras i denna fil,
// men det är oftast bättre i en dedikerad index.js för modeller.
// import { Transaction } from './transactionModel.js';
// import { ReceiptLineItem } from './receiptLineItemModel.js'; // När den finns

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
    // Foreign key-relationen definieras separat nedan
  },
  vat_summary: {                // NY kolumn
    type: DataTypes.JSON,
    allowNull: true
  },
  // createdAt och updatedAt sköts av timestamps: true
}, {
  tableName: 'receipts',
  timestamps: true,             // Använder createdAt och updatedAt automatiskt
  createdAt: 'createdAt',       // Mappa till era kolumnnamn om de skiljer sig
  updatedAt: 'updatedAt'        // t.ex. created_at, updated_at
});

// === Uppdaterad PaymentMethod-modell ===
const PaymentMethod = sequelize.define('PaymentMethod', {
  // id: (INTEGER, PK, AI) läggs till automatiskt av Sequelize
  receipt_id: {                 // Kolumn för FK
    type: DataTypes.INTEGER,
    allowNull: false
    // Själva FK-relationen definieras nedan
  },
  method: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  amount: {                     // Ändrad typ
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  label: {                      // Behålls om den används
    type: DataTypes.STRING,
    allowNull: true,            // Kanske bättre att tillåta NULL?
  },
  details: {                    // Behålls om den används
    type: DataTypes.JSON,
    allowNull: true,
  },
  timestamp: {                  // Matcha er databaskolumn
    type: DataTypes.DATE,
    allowNull: true             // Kanske ska vara false? Sattes default NOW i gamla modellen
  },
  cardType: {                   // Matcha er databaskolumn (om den finns separat)
    type: DataTypes.STRING,
    allowNull: true,
  },
  maskedPan: {                  // Matcha er databaskolumn (om den finns separat)
     type: DataTypes.STRING,
     allowNull: true,
  },
  // changeGiven togs bort, men lägg tillbaka om den finns och behövs
  // changeGiven: { type: DataTypes.DECIMAL(10, 2), allowNull: true, }
}, {
  tableName: 'paymentmethods', // Se till att namnet matchar er tabell
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
});

// === Definiera Relationer ===
// (Görs efter att båda modellerna är definierade)

// Ett Kvitto (Receipt) har många Betalningsmetoder (PaymentMethod)
Receipt.hasMany(PaymentMethod, {
  foreignKey: {
    name: 'receipt_id',       // Kolumnen i PaymentMethod som pekar på Receipt
    allowNull: false
  },
  as: 'paymentMethods'          // Valfritt alias
});
// En Betalningsmetod (PaymentMethod) hör till ett Kvitto (Receipt)
PaymentMethod.belongsTo(Receipt, {
  foreignKey: {
    name: 'receipt_id',
    allowNull: false
  }
});
Receipt.hasMany(ReceiptLineItem, { foreignKey: 'receipt_id', as: 'lineItems' });

// TODO Senare: Lägg till relationer till Transaction och ReceiptLineItem
// När ReceiptLineItem-modellen finns:
// Receipt.hasMany(ReceiptLineItem, { foreignKey: 'receipt_id', as: 'lineItems' });
// ReceiptLineItem.belongsTo(Receipt, { foreignKey: 'receipt_id' });

// När Transaction-modellen är tillgänglig (via import eller index.js):
// Receipt.belongsTo(Transaction, { foreignKey: 'transaction_id', as: 'transaction' });
// Transaction.hasMany(Receipt, { foreignKey: 'transaction_id', as: 'receipts' });


// === Exportera Modellerna ===
export { Receipt, PaymentMethod };