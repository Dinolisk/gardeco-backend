import { DataTypes } from 'sequelize';
import { sequelize } from '../Database/db.js';

export const Card = sequelize.define('Card', {
  cardId: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true,
    field: 'card_id' // maps camelCase to snake_case in DB
  },
  maskedPan: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'masked_pan'
  },
  cardType: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'card_type'
  }
}, {
  tableName: 'cards',
  timestamps: true,
  underscored: true // automatically converts camelCase to snake_case
});

/**
 * Save or update card information
 * @param {string} cardId - The unique identifier for the card
 * @param {string} maskedPan - The masked PAN number
 * @param {string} cardType - The type of card
 * @param {Object} options - Additional options (e.g., transaction)
 * @returns {Promise<Object>} The card record
 */
export const saveCard = async (cardId, maskedPan, cardType, options = {}) => {
  try {
    console.log("Saving Card:", { cardId, maskedPan, cardType });

    const [card, created] = await Card.findOrCreate({
      where: { cardId },
      defaults: {
        maskedPan,
        cardType
      },
      transaction: options.transaction
    });

    // Update if the card exists but has different info
    if (!created && (card.maskedPan !== maskedPan || card.cardType !== cardType)) {
      console.log(`Updating existing card info for cardId: ${cardId}`);
      await card.update({
        maskedPan,
        cardType
      }, { transaction: options.transaction });
    }

    console.log(created ? "Card created" : "Card found/updated");
    return card;
  } catch (error) {
    console.error("Error saving card to database:", error);
    throw error;
  }
};

export default Card; 