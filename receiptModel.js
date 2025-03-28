const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config(); // Ladda miljövariabler från .env (lokalt)

// Skapa Sequelize-anslutning till databasen
const sequelize = new Sequelize({
  host: process.env.DB_HOST,          // T.ex. din AWS RDS host
  username: process.env.DB_USER,      // T.ex. admin
  password: process.env.DB_PASSWORD,  // T.ex. ditt lösenord
  database: process.env.DB_NAME,      // T.ex. kvitton_db
  dialect: 'mysql',                   // MySQL som databas
  logging: false,                     // Sätt till true för att se SQL-frågor
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

// Definiera PaymentMethod-modellen
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
    type: DataTypes.JSON, // MySQL stöder JSON, inte JSONB
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

// Definiera relationer mellan modellerna
Receipt.hasMany(PaymentMethod, { foreignKey: 'receipt_id' });
PaymentMethod.belongsTo(Receipt, { foreignKey: 'receipt_id' });

// Synkronisera modeller med databasen
sequelize.sync({ force: false }) // force: false behåller befintlig data
  .then(() => console.log('✅ Ansluten och synkroniserad med MySQL'))
  .catch((err) => console.error('❌ Fel vid anslutning/synkronisering:', err));

// Exportera sequelize och modellerna för användning i index.js
module.exports = { sequelize, Receipt, PaymentMethod };