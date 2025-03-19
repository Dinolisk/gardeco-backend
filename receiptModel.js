// receiptModel.js
const mongoose = require('mongoose');

// Schema för kvitton
const receiptSchema = new mongoose.Schema({
  paymentMethods: [
    {
      method: { type: String, required: true },  // Typen av betalningsmetod (t.ex. 'Card', 'Cash', 'Swish')
      amount: { type: Number, required: true },  // Belopp som betalats
      label: { type: String, required: true },   // Beskrivning av betalningen (t.ex. "Betalning med kort")
      cardDetails: {  // För kortbetalning
        cardType: String,   // Typ av kort (Visa, Mastercard, etc.)
        last4: String,      // Sista 4 siffror på kortnumret
      },
      cashDetails: {   // För kontantbetalning
        changeGiven: Number,  // Vexel som gavs till kunden
      },
      details: mongoose.Schema.Types.Mixed,  // För mer flexibla betalningar som Swish, Klarna, etc.
      timestamp: { type: Date, default: Date.now },  // Tidpunkt för betalningen
    },
  ],
  total: { type: Number, required: true },  // Totalbelopp för alla betalningar
  createdAt: { type: Date, default: Date.now },  // Tidpunkt när kvittot skapades
});

// Modell för kvitton
const Receipt = mongoose.model('Receipt', receiptSchema);

module.exports = Receipt;