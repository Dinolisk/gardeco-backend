import { DataTypes } from 'sequelize';
import { sequelize } from '../Database/db.js';

const CardID = sequelize.define('CardID', {
  cardId: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true
  },
  maskedPan: {
    type: DataTypes.STRING,
    allowNull: true
  },
  cardType: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'card_ids',
  timestamps: true
});

// Function to save or update card ID information
export const saveCardId = async (cardId, maskedPan, cardType) => {
  try {
    console.log("Saving Card ID:", { cardId, maskedPan, cardType });

    const [cardIdRecord, created] = await CardID.findOrCreate({
      where: { cardId },
      defaults: {
        maskedPan,
        cardType
      }
    });

    // If the card exists but has different info, update it
    if (!created && (cardIdRecord.maskedPan !== maskedPan || cardIdRecord.cardType !== cardType)) {
      await cardIdRecord.update({
        maskedPan,
        cardType
      });
    }

    console.log(created ? "Card ID created" : "Card ID updated");
    return cardIdRecord;
  } catch (error) {
    console.error("Error saving card ID to database:", error);
    throw error;
  }
};

export { CardID };
