import { sequelize } from "../Database/db.js";
import { Card, saveCard } from "../Models/cardModel.js";
import { saveMembership } from "../Models/membershipModel.js";
import { saveTransaction } from "../Models/transactionModel.js";

// Function to handle transaction data
export const handleTransaction = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const { cardId, transactionData } = req.body;

    // Basic validation
    if (!cardId || !transactionData) {
      await transaction.rollback();
      return res.status(400).json({ error: "Missing cardId or transactionData" });
    }

    // Save card information
    if (transactionData.paymentCard) {
      await saveCard(
        cardId,
        transactionData.paymentCard.maskedPan?.[0]?.maskedPanValue,
        transactionData.paymentCard.cardType,
        { transaction }
      );
    }

    // Save membership information if present
    if (transactionData.membership) {
      await saveMembership(transactionData.membership, cardId, { transaction });
    }

    // Save transaction
    const savedTransaction = await saveTransaction(transactionData, cardId, { transaction });

    await transaction.commit();
    res.json(savedTransaction);
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};