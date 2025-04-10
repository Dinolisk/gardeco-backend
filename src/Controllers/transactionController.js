import { sequelize } from "../Database/db.js";
import { Transaction } from "../Models/transactionModel.js";
import { CardInfo } from "../Models/cardInfoModel.js";
import { Membership } from "../Models/membershipModel.js";
import { saveCardInfo } from "../Models/cardInfoModel.js";
import { saveMembership } from "../Models/membershipModel.js";
import { saveTransaction } from "../Models/transactionModel.js";

// Function to handle transaction data
export const handleTransaction = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { cardId, transactionData } = req.body;

    // Save card information
    if (transactionData.paymentCard) {
      await saveCardInfo(
        cardId,
        transactionData.paymentCard.maskedPan?.[0]?.maskedPanValue,
        transactionData.paymentCard.cardType
      );
    }

    // Save membership information if present
    if (transactionData.membership) {
      await saveMembership(transactionData.membership, cardId);
    }

    // Save transaction
    const savedTransaction = await saveTransaction(transactionData, cardId);

    await transaction.commit();
    res.json(savedTransaction);
  } catch (error) {
    await transaction.rollback();
    console.error("Error handling transaction:", error);
    res.status(500).json({ error: "Failed to process transaction" });
  }
};
