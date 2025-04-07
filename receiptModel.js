const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config(); // Ladda miljövariabler från .env (lokalt)

// Skapa Sequelize-anslutning till databasen
const sequelize = new Sequelize({
  host: process.env.DB_HOST,       // T.ex. localhost
  username: process.env.DB_USER,     // T.ex. root eller kvitton_app
  password: process.env.DB_PASSWORD, // Ditt databaslösenord
  database: process.env.DB_NAME,     // kvitton_db
  dialect: 'mysql',                // MySQL som databas
  logging: false,                  // Sätt till console.log för att se SQL-frågor
});

// Definiera Receipt-modellen
const Receipt = sequelize.define('Receipt', {
  total: {
    // Fundera på om DECIMAL(10, 2) vore bättre här för att lagra kronor och ören exakt?
    // Just nu lagras det som heltal (troligen ören).
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  // Om din SQL hade en explicit createdAt, kan du definiera den här.
  // Annars sköter Sequelize createdAt och updatedAt automatiskt.
  // createdAt: {
  //   type: DataTypes.DATE,
  //   defaultValue: Sequelize.NOW,
  //   allowNull: false,
  // },
});

// Definiera PaymentMethod-modellen
const PaymentMethod = sequelize.define('PaymentMethod', {
  // 'id' skapas automatiskt av Sequelize som primary key
  receipt_id: { // Foreign key som kopplar till Receipt
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Receipt, // Refererar till Receipt-modellen (blir 'Receipts'-tabellen)
      key: 'id',
    },
  },
  method: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  amount: {
    // Samma fundering som för Receipt.total angående INTEGER vs DECIMAL
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  label: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  details: {
    type: DataTypes.JSON, // Bra för flexibel data som kortdetaljer, Swish-nummer etc.
    allowNull: true,
  },
  timestamp: {
    // Denna kanske är överflödig om du förlitar dig på createdAt/updatedAt?
    // Beror på om du behöver en specifik 'betaltidpunkt' separat.
    type: DataTypes.DATE,
    defaultValue: Sequelize.NOW,
    allowNull: false,
  },
  cardType: {
    // Dessa tre fält kanske passar bättre i 'details'-JSON,
    // eller i den nya Transaction-modellen om de hör specifikt till kortterminal-transaktionen?
    type: DataTypes.STRING,
    allowNull: true,
  },
  last4: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  changeGiven: {
    type: DataTypes.INTEGER, // Växel tillbaka (för kontant)
    allowNull: true,
  },
  // createdAt och updatedAt hanteras automatiskt av Sequelize som standard
});

// --- START PÅ NY MODELL ---
// Definiera Transaction-modellen baserat på din SQL
const Transaction = sequelize.define('Transaction', {
  // id (PRIMARY KEY AUTO_INCREMENT) hanteras automatiskt av Sequelize
  retrievalReferenceNumber: {
    type: DataTypes.STRING, // VARCHAR(255)
    allowNull: false,
  },
  acquirerTerminalId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  acquirerMerchantId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  cardType: {
    type: DataTypes.STRING(50), // VARCHAR(50)
    allowNull: false,
  },
  acquirerTransactionTimestamp: {
    // Kanske DataTypes.DATE om formatet alltid är konsekvent och du vill lagra det som datum/tid?
    type: DataTypes.STRING,
    allowNull: false,
  },
  transactionAmount: {
    type: DataTypes.DECIMAL(10, 2), // DECIMAL(10, 2) - Bra för exakta belopp
    allowNull: false,
  },
  transactionCurrency: {
    type: DataTypes.STRING(10), // VARCHAR(10)
    allowNull: false,
  },
  authorizationCode: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  systemTraceAuditNumber: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  maskedPan: { // Använder 'maskedPan' (Primary Account Number) istället för 'maskedPen' - ändra om 'Pen' var avsiktligt
    type: DataTypes.STRING,
    allowNull: false,
  },
  merchantName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  // createdAt och updatedAt hanteras automatiskt av Sequelize som standard
}, {
  // Lägger till indexet från din SQL-definition
  indexes: [
    {
      name: 'idx_retrievalReferenceNumber',
      fields: ['retrievalReferenceNumber']
    }
  ]
});
// --- SLUT PÅ NY MODELL ---


// Definiera relationer mellan modellerna (Receipt och PaymentMethod)
Receipt.hasMany(PaymentMethod, { foreignKey: 'receipt_id' });
PaymentMethod.belongsTo(Receipt, { foreignKey: 'receipt_id' });

// Notera: Vi definierar ingen *explicit* Sequelize-relation mellan PaymentMethod och Transaction här,
// eftersom planen var att länka dem genom att spara transaktions-ID i PaymentMethod.details.


// Synkronisera modeller med databasen
// Detta kommer nu att försöka skapa 'Receipts', 'PaymentMethods', OCH 'Transactions'-tabellerna
// i databasen 'kvitton_db' om de inte redan finns.
sequelize.sync({ force: false }) // force: false behåller befintlig data
  .then(() => console.log('✅ Ansluten och synkroniserad med MySQL'))
  .catch((err) => console.error('❌ Fel vid anslutning/synkronisering:', err));

// Exportera sequelize och ALLA modeller för användning i index.js
module.exports = { sequelize, Receipt, PaymentMethod, Transaction }; // Glöm inte Transaction här!