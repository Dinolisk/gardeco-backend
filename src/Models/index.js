// src/Models/index.js
import { Sequelize } from 'sequelize';
import { sequelize } from '../Database/db.js'; // Er befintliga sequelize-instans

// Importera alla era modelldefinitioner
import { Transaction } from './transactionModel.js';
import { Card } from './cardModel.js';
import { Membership } from './membershipModel.js';
import { Receipt, PaymentMethod } from './receiptModel.js'; // Båda från samma fil
import { ReceiptLineItem } from './receiptLineItemModel.js';

// Skapa ett objekt för att hålla alla modeller och sequelize-instansen
const db = {};

// Lägg till modellerna i db-objektet
db.Transaction = Transaction;
db.Card = Card;
db.Membership = Membership;
db.Receipt = Receipt;
db.PaymentMethod = PaymentMethod;
db.ReceiptLineItem = ReceiptLineItem;

// Lägg till sequelize-instansen och Sequelize-klassen (bra att ha)
db.sequelize = sequelize;
db.Sequelize = Sequelize;

// === Definiera Relationer (Associations) ===
// Här definierar vi alla kopplingar mellan tabellerna centralt

// --- Relationer för Receipt ---
// Ett Kvitto (Receipt) hör till en Transaktion (Transaction)
db.Receipt.belongsTo(db.Transaction, {
  foreignKey: 'transaction_id', // Kolumnen i receipts-tabellen
  as: 'transaction'             // Valfritt alias för att komma åt relationen
});
// En Transaktion (Transaction) kan ha ett eller flera Kvitton (Receipt)
db.Transaction.hasMany(db.Receipt, {
  foreignKey: 'transaction_id', // Kolumnen i receipts-tabellen
  as: 'receipts'                // Valfritt alias
});

// Ett Kvitto (Receipt) har många Betalningsmetoder (PaymentMethod)
db.Receipt.hasMany(db.PaymentMethod, {
  foreignKey: 'receipt_id',     // Kolumnen i paymentmethods-tabellen
  as: 'paymentMethods'
});
// En Betalningsmetod (PaymentMethod) hör till ett Kvitto (Receipt)
db.PaymentMethod.belongsTo(db.Receipt, {
  foreignKey: 'receipt_id'
});

// Ett Kvitto (Receipt) har många Varuposter (ReceiptLineItem)
db.Receipt.hasMany(db.ReceiptLineItem, {
  foreignKey: 'receipt_id',     // Kolumnen i receipt_line_items-tabellen
  as: 'lineItems'
});
// En Varupost (ReceiptLineItem) hör till ett Kvitto (Receipt)
db.ReceiptLineItem.belongsTo(db.Receipt, {
  foreignKey: 'receipt_id'
});


// --- Eventuella relationer för CardInfo / Membership ---
// Om ett Medlemskap (Membership) hör till ett Kort (CardInfo)
// OBS: Kontrollera att `card_id` är korrekt FK i Membership-modellen/-tabellen
db.Membership.belongsTo(db.Card, {
  foreignKey: 'card_id'
});
// Ett Kort (CardInfo) kan ha många Medlemskap (Membership)
db.Card.hasMany(db.Membership, {
  foreignKey: 'card_id',
  as: 'memberships'
});

// Lägg till fler relationer här om det behövs mellan andra modeller
// (t.ex. Transaction <-> CardInfo?)


// === Exportera db-objektet ===
export default db;