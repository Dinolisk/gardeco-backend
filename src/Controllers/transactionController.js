import { sequelize } from "../Database/db.js";
import { Card, saveCard } from "../Models/cardModel.js";
import { saveMembership } from "../Models/membershipModel.js";
import { saveTransaction } from "../Models/transactionModel.js";

// Function to handle transaction data
export const handleTransaction = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const { cardId, transactionData } = req.body;
    
    console.log('Received transaction request:', {
      cardId,
      transactionData: JSON.stringify(transactionData, null, 2)
    });

    // Basic validation
    if (!cardId || !transactionData) {
      console.error('Missing required fields:', { cardId: !!cardId, transactionData: !!transactionData });
      await transaction.rollback();
      return res.status(400).json({ error: "Missing cardId or transactionData" });
    }

    // Save card information
    if (transactionData.paymentCard) {
      console.log('Saving card information...');
      try {
        await saveCard(
          cardId,
          transactionData.paymentCard.maskedPan?.[0]?.maskedPanValue,
          transactionData.paymentCard.cardType,
          { transaction }
        );
        console.log('Card information saved successfully');
      } catch (cardError) {
        console.error('Error saving card:', cardError);
        throw cardError;
      }
    }

    // Save membership information if present
    if (transactionData.membership) {
      console.log('Saving membership information...');
      try {
        await saveMembership(transactionData.membership, cardId, { transaction });
        console.log('Membership information saved successfully');
      } catch (membershipError) {
        console.error('Error saving membership:', membershipError);
        throw membershipError;
      }
    }

    // Save transaction
    console.log('Saving transaction...');
    try {
      const savedTransaction = await saveTransaction(transactionData, cardId, { transaction });
      console.log('Transaction saved successfully:', savedTransaction.id);
      
      await transaction.commit();
      console.log('Transaction committed successfully');
      
      res.json(savedTransaction);
    } catch (transactionError) {
      console.error('Error saving transaction:', transactionError);
      throw transactionError;
    }
  } catch (error) {
    console.error('Transaction processing failed:', error);
    await transaction.rollback();
    next(error);
  }
};