import { sequelize } from "../Database/db.js";
import { saveCardInfo } from "../Models/cardInfoModel.js";
import { saveMembership } from "../Models/membershipModel.js";
import { saveTransaction } from "../Models/transactionModel.js";

// Function to handle transaction data
export const handleTransaction = async (req, res, next) => { // Lade till next för felhantering
  const transaction = await sequelize.transaction();

  try {
    const { cardId, transactionData } = req.body;

    // Basic validation
    if (!cardId || !transactionData) {
      await transaction.rollback(); // Rollback before returning error
      return res.status(400).json({ error: "Missing cardId or transactionData" });
    }

    // Save card information
    if (transactionData.paymentCard) {
      await saveCardInfo(
        cardId,
        transactionData.paymentCard.maskedPan?.[0]?.maskedPanValue,
        transactionData.paymentCard.cardType,
        { transaction } // <-- Skicka med transaktion
      );
    }

    // Save membership information if present
    if (transactionData.membership) {
      // Antag att saveMembership tar (membershipData, cardId, options)
      await saveMembership(transactionData.membership, cardId, { transaction }); // <-- Skicka med transaktion
    }

    // Save transaction
    // Antag att saveTransaction tar (transactionData, cardId, options)
    const savedTransaction = await saveTransaction(transactionData, cardId, { transaction }); // <-- Skicka med transaktion

    await transaction.commit();
    res.json(savedTransaction); // Skicka tillbaka den sparade transaktionen
  } catch (error) {
     // Försök att göra rollback om transaktionen inte redan är avslutad
     if (transaction && !transaction.finished) {
        try {
            await transaction.rollback();
        } catch (rollbackError) {
            console.error('Error rolling back transaction in handleTransaction:', rollbackError);
        }
    }
    console.error("Error handling transaction:", error);
    res.status(500).json({ error: "Failed to process transaction" });
    // Optional: Pass error to an error handling middleware if you have one
    // next(error);
  }
};