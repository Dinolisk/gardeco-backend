require('dotenv').config(); // Ladda miljövariabler från .env
const express = require('express');
const cors = require('cors');
const { Sequelize, DataTypes } = require('sequelize');

const app = express();

app.use(cors());
app.use(express.json());

// Skapa Sequelize-anslutning till AWS RDS
const sequelize = new Sequelize({
  host: process.env.DB_HOST,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  dialect: 'mysql',
  logging: false, // Sätt till true om du vill se SQL-frågor i konsolen
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
    type: DataTypes.JSON, // För att lagra detaljer som JSON
    allowNull: true,
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.NOW,
    allowNull: false,
  },
});

// Definiera relationer mellan modellerna
Receipt.hasMany(PaymentMethod, { foreignKey: 'receipt_id' });
PaymentMethod.belongsTo(Receipt, { foreignKey: 'receipt_id' });

// Synkronisera modeller med databasen
sequelize.sync({ force: false }) // force: false behåller befintlig data
  .then(() => console.log('✅ Ansluten och synkroniserad med MySQL'))
  .catch((err) => console.error('❌ Fel vid anslutning/synkronisering:', err));

// Endpoint: Hemsida
app.get('/', (req, res) => res.send('Hej från backend!'));

// Endpoint: Spara kvitto
app.post('/receipt', async (req, res) => {
  const { paymentMethods, total } = req.body;
  try {
    // Skapa ett nytt kvitto
    const receipt = await Receipt.create({ total });
    const receiptId = receipt.id;

    // Skapa betalningsmetoder kopplade till kvittot
    await Promise.all(
      paymentMethods.map((pm) =>
        PaymentMethod.create({
          receipt_id: receiptId,
          method: pm.method,
          amount: pm.amount,
          label: pm.label,
          details: pm.details, // Sequelize hanterar JSON automatiskt
        })
      )
    );

    res.status(200).json({ message: '✅ Kvitto sparat i databasen' });
  } catch (err) {
    console.error('❌ Fel vid sparande av kvitto:', err.message);
    res.status(500).json({ message: 'Fel vid sparande av kvitto', error: err.message });
  }
});

// Endpoint: Hämta alla kvitton
app.get('/get-receipt', async (req, res) => {
  try {
    const receipts = await Receipt.findAll({
      include: [{ model: PaymentMethod }], // Hämta relaterade betalningsmetoder
    });
    res.status(200).json({ receipts });
  } catch (err) {
    console.error('❌ Fel vid hämtning av kvitton:', err.message);
    res.status(500).json({ message: 'Fel vid hämtning av kvitton', error: err.message });
  }
});

// Starta servern
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server kör på port ${PORT}`));