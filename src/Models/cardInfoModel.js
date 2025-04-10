import { DataTypes } from 'sequelize';
import { sequelize } from '../Database/db.js';

const CardInfo = sequelize.define('CardInfo', {
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
  timestamps: true
});

// Function to save or update card information
export const saveCardInfo = async (cardId, maskedPan, cardType) => {
  try {
    console.log("Saving Card Info:", { cardId, maskedPan, cardType });

    const [cardInfo, created] = await CardInfo.findOrCreate({
      where: { card_id: cardId },
      defaults: {
        masked_pan: maskedPan,
        card_type: cardType
      }
    });

    // If the card exists but has different info, update it
    if (!created && (cardInfo.masked_pan !== maskedPan || cardInfo.card_type !== cardType)) {
      await cardInfo.update({
        masked_pan: maskedPan,
        card_type: cardType
      });
    }

    console.log(created ? "Card info created" : "Card info updated");
    return cardInfo;
  } catch (error) {
    console.error("Error saving card info to database:", error);
    throw error;
  }
};

export { CardInfo };
