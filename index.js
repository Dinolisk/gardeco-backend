// index.js
require('dotenv').config(); // Laddar miljövariabler från .env

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const Receipt = require('./receiptModel'); // Importera Receipt-modellen från receiptModel.js

const app = express();

app.use(cors());
app.use(express.json());

// Använd MongoDB-URI från .env istället för att hårdkoda den
const mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI)
  .then(() => {
    console.log('✅ Ansluten till MongoDB');
    return mongoose.connection.db.admin().ping();
  })
  .then(() => console.log('✅ Pinged your deployment. Connection successful!'))
  .catch(err => {
    console.error('❌ Fel vid anslutning till MongoDB:', err.message);
    process.exit(1); // Stäng ner servern vid anslutningsfel
  });

app.get('/', (req, res) => res.send('Hej från backend!'));

// Endpoint för att ta emot kvittodata
app.post('/receipt', async (req, res) => {
  const receiptData = req.body;
  console.log('📩 Mottaget kvitto:', receiptData);

  try {
    const newReceipt = new Receipt(receiptData);  // Använd Receipt-modellen
    await newReceipt.save();
    res.status(200).json({ message: '✅ Kvitto sparat i databasen' });
  } catch (error) {
    console.error('❌ Fel vid sparande av kvitto:', error.message);
    res.status(500).json({ message: 'Fel vid sparande av kvitto', error: error.message });
  }
});

// Endpoint för att hämta alla kvitton
app.get('/get-receipt', async (req, res) => {
  try {
    const receipts = await Receipt.find();  // Hämta kvitton från databasen
    console.log('📜 Hämtar alla kvitton:', receipts);
    res.status(200).json({ receipts });
  } catch (error) {
    console.error('❌ Fel vid hämtning av kvitton:', error.message);
    res.status(500).json({ message: 'Fel vid hämtning av kvitton', error: error.message });
  }
});

// Starta servern
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server kör på port ${PORT}`));