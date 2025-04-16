import { DataTypes } from 'sequelize';
import { sequelize } from '../Database/db.js';

// --- Model Definition (med export direkt) ---
export const CardInfo = sequelize.define('CardInfo', {
  card_id: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true
  },
  masked_pan: {
    type: DataTypes.STRING,
    allowNull: true
  },
  card_type: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'card_info',
  timestamps: true // Använder Sequelize standard createdAt/updatedAt
  // Om du vill ha dina egna namn, lägg till t.ex.:
  // createdAt: 'created_at',
  // updatedAt: 'updated_at'
});

// --- Uppdaterad saveCardInfo Function ---
// Function to save or update card information within a transaction
export const saveCardInfo = async (cardId, maskedPan, cardType, options = {}) => {
  try {
    console.log("Saving Card Info:", { cardId, maskedPan, cardType });

    // Skicka med transaction till findOrCreate
    const [cardInfo, created] = await CardInfo.findOrCreate({
      where: { card_id: cardId },
      defaults: {
        masked_pan: maskedPan,
        card_type: cardType
      },
      transaction: options.transaction // <-- Skickar med transaktion
    });

    // If the card exists but has different info, update it within the transaction
    if (!created && (cardInfo.masked_pan !== maskedPan || cardInfo.card_type !== cardType)) {
      console.log(`Updating existing card info for card_id: ${cardId}`);
      // Skicka med transaction till update
      await cardInfo.update({
        masked_pan: maskedPan,
        card_type: cardType
      }, { transaction: options.transaction }); // <-- Skickar med transaktion
    }

    console.log(created ? "Card info created" : "Card info found/updated");
    return cardInfo;
  } catch (error) {
    console.error("Error saving card info to database:", error);
    throw error; // Kasta felet vidare för rollback i controllern
  }
};

// Ingen 'export { CardInfo };' behövs i slutet eftersom vi exporterar den vid definitionen nu.