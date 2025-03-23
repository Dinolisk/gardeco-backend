const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();  // Ladda miljövariabler från .env

// Skapa en ny instans av Sequelize och koppla till din MySQL-databas via miljövariabler från .env
const sequelize = new Sequelize({
  host: process.env.DB_HOST,          // T.ex. database-1.c3gqi4amgqn9.eu-north-1.rds.amazonaws.com
  username: process.env.DB_USER,      // T.ex. admin
  password: process.env.DB_PASSWORD,  // T.ex. vilunda06
  database: process.env.DB_NAME,      // T.ex. kvitton_db
  dialect: 'mysql',                   // MySQL är databasdialekten
  logging: false,                     // Sätt till true om du vill logga SQL-frågor
});

// Definiera Receipt-modellen
const Receipt = sequelize.define('Receipt', {
  total: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.NOW,
    allowNull: false,
  },
});

// Definiera PaymentMethod-modellen (en separat modell för betalningsmetoder)
const PaymentMethod = sequelize.define('PaymentMethod', {
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
  details: {
    type: DataTypes.JSONB,  // För flexibla betalningsdetaljer (Swish, Klarna, etc.)
    allowNull: true,
  },
});

// Definiera relationen mellan Receipt och PaymentMethod (en Receipt kan ha flera PaymentMethods)
Receipt.hasMany(PaymentMethod, { foreignKey: 'receiptId' });
PaymentMethod.belongsTo(Receipt, { foreignKey: 'receiptId' });

// Synkronisera modeller med databasen
sequelize.sync()
  .then(() => console.log('✅ Synkronisering med MySQL-databasen lyckades'))
  .catch((err) => console.error('❌ Fel vid synkronisering:', err));

module.exports = { Receipt, PaymentMethod };