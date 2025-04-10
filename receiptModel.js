// Fil: models/receiptModel.js (eller motsvarande sökväg)

const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config(); // Ladda miljövariabler från .env (lokalt)

// Skapa Sequelize-anslutning till databasen
const sequelize = new Sequelize({
  host: process.env.DB_HOST,       // T.ex. localhost
  username: process.env.DB_USER,     // T.ex. root eller kvitton_app
  password: process.env.DB_PASSWORD, // Ditt dataok baslösenord
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
  // createdAt och updatedAt hanteras automatiskt av Sequelize som standard
  // Om din SQL hade en explicit createdAt, kan du definiera den här.
  // createdAt: {
  //   type: DataTypes.DATE,
  //   defaultValue: Sequelize.NOW,
  //   allowNull: false,
  // },
});

// Definiera PaymentMethod-modellen som hanterar olika betalningsmetoder för kvitton
// Denna modell kan hantera olika typer av betalningar som kort, kontant, Swish etc.
const PaymentMethod = sequelize.define('PaymentMethod', {
  // 'id' skapas automatiskt av Sequelize som primary key
  receipt_id: { // Foreign key som kopplar till Receipt
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Receipt, // Refererar till Receipt-modellen (blir 'Receipts'-tabellen)
      key: 'id',
    },
    // Om du vill att PaymentMethods ska tas bort när ett Receipt tas bort:
    // onDelete: 'CASCADE',
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
    // Dessa tre fält kanske passar bättre i 'details'-JSON?
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

// Definiera relationer mellan modellerna (Receipt och PaymentMethod)
Receipt.hasMany(PaymentMethod, { foreignKey: 'receipt_id' });
PaymentMethod.belongsTo(Receipt, { foreignKey: 'receipt_id' });

// Synkronisera modeller med databasen
sequelize.sync({ force: false }) // force: false behåller befintlig data
  .then(() => {
    console.log('✅ Ansluten och synkroniserad med MySQL (Receipts/PaymentMethods)');


  })
  .catch((err) => console.error('❌ Fel vid anslutning/synkronisering:', err));

// Exportera sequelize och de relevanta modellerna för användning i index.js
module.exports = { sequelize, Receipt, PaymentMethod }; // Endast de två modellerna exporteras