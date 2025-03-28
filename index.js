require('dotenv').config(); // Ladda miljövariabler från .env (bara lokalt)
const express = require('express');
const cors = require('cors');
const { sequelize, Receipt, PaymentMethod } = require('./receiptModel'); // Importera från receiptModel.js

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Endpoint: Hemsida
app.get('/', (req, res) => res.send('Hej från gardeco-backend!'));

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