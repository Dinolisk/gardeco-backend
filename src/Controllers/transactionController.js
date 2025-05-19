import { sequelize } from "../Database/db.js";
import { Card, saveCard } from "../Models/cardModel.js";
import { saveMembership } from "../Models/membershipModel.js";
import { saveTransaction } from "../Models/transactionModel.js";

// Function to handle transaction data
export const handleTransaction = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const { cardId, transactionData } = req.body;
    
    console.log('Raw transactionData type:', typeof transactionData);
    console.log('Raw transactionData:', transactionData);
    
    // Parse transactionData if it's a string
    const parsedTransactionData = typeof transactionData === 'string' ? JSON.parse(transactionData) : transactionData;
    
    console.log('Parsed transactionData type:', typeof parsedTransactionData);
    console.log('Parsed transactionData:', JSON.stringify(parsedTransactionData, null, 2));
    console.log('SchemaVersion from parsed data:', parsedTransactionData.schemaVersion);
    
    console.log('Received transaction request:', {
      cardId,
      transactionData: JSON.stringify(parsedTransactionData, null, 2)
    });

    // Basic validation
    if (!cardId || !parsedTransactionData) {
      console.error('Missing required fields:', { cardId: !!cardId, transactionData: !!parsedTransactionData });
      await transaction.rollback();
      return res.status(400).json({ error: "Missing cardId or transactionData" });
    }

    // Prepare X-Receipts structure
    const xReceiptsData = {
      schemaVersion: parsedTransactionData.schemaVersion,
      xReceipts: {
        clientId: parsedTransactionData.clientId || "123456789",
        roundTripId: parsedTransactionData.roundTripId || "123e4567-e89b-12d3-a456-426614174000",
        cardholderReference: parsedTransactionData.cardholderReference,
        cardholderConsents: parsedTransactionData.cardholderConsents || [],
        cardholderMemberships: parsedTransactionData.cardholderMemberships || [],
        lineItems: parsedTransactionData.lineItems || parsedTransactionData.xReceipts?.lineItems || [],
        orderSummary: parsedTransactionData.orderSummary || parsedTransactionData.xReceipts?.orderSummary || {}
      },
      line_items: parsedTransactionData.lineItems || parsedTransactionData.xReceipts?.lineItems || [],
      order_summary: parsedTransactionData.orderSummary || parsedTransactionData.xReceipts?.orderSummary || {},
      merchantName: parsedTransactionData.merchantName,
      acquirerTerminalId: parsedTransactionData.acquirerTerminalId,
      acquirerTransactionTimestamp: parsedTransactionData.acquirerTransactionTimestamp,
      transactionAmount: {
        merchantTransactionAmount: parsedTransactionData.transactionAmount.merchantTransactionAmount,
        merchantTransactionCurrency: parsedTransactionData.transactionAmount.merchantTransactionCurrency,
        cardholderTransactionAmount: parsedTransactionData.transactionAmount.cardholderTransactionAmount,
        cardholderTransactionCurrency: parsedTransactionData.transactionAmount.cardholderTransactionCurrency
      },
      transactionIdentifier: {
        authorizationCode: parsedTransactionData.transactionIdentifier.authorizationCode,
        systemTraceAuditNumber: parsedTransactionData.transactionIdentifier.systemTraceAuditNumber,
        retrievalReferenceNumber: parsedTransactionData.transactionIdentifier.retrievalReferenceNumber
      },
      paymentCard: {
        cardType: parsedTransactionData.paymentCard.cardType,
        maskedPan: parsedTransactionData.paymentCard.maskedPan,
        acquirerMerchantIds: parsedTransactionData.paymentCard.acquirerMerchantIds
      },
      payment: [{
        paymentMethod: "CARD",
        paymentType: "CREDIT",
        cardType: parsedTransactionData.paymentCard.cardType,
        maskedPan: parsedTransactionData.paymentCard.maskedPan[0].maskedPanValue,
        acquirerTerminalId: parsedTransactionData.acquirerTerminalId,
        acquirerMerchantId: parsedTransactionData.paymentCard?.acquirerMerchantIds?.acquirerMerchantId,
        acquirerTransactionTimestamp: parsedTransactionData.acquirerTransactionTimestamp,
        transactionAmount: {
          merchantTransactionAmount: parsedTransactionData.transactionAmount.merchantTransactionAmount,
          merchantTransactionCurrency: parsedTransactionData.transactionAmount.merchantTransactionCurrency
        },
        transactionIdentifier: {
          authorizationCode: parsedTransactionData.transactionIdentifier.authorizationCode,
          systemTraceAuditNumber: parsedTransactionData.transactionIdentifier.systemTraceAuditNumber,
          retrievalReferenceNumber: parsedTransactionData.transactionIdentifier.retrievalReferenceNumber
        }
      }]
    };

    // Save card information
    if (parsedTransactionData.paymentCard) {
      console.log('Saving card information...');
      try {
        await saveCard(
          cardId,
          parsedTransactionData.paymentCard.maskedPan?.[0]?.maskedPanValue,
          parsedTransactionData.paymentCard.cardType,
          { transaction }
        );
        console.log('Card information saved successfully');
      } catch (cardError) {
        console.error('Error saving card:', cardError);
        throw cardError;
      }
    }

    // Save membership information if present
    if (parsedTransactionData.membership) {
      console.log('Saving membership information...');
      try {
        await saveMembership(parsedTransactionData.membership, cardId, { transaction });
        console.log('Membership information saved successfully');
      } catch (membershipError) {
        console.error('Error saving membership:', membershipError);
        throw membershipError;
      }
    }

    // Save transaction
    console.log('DEBUG: xReceiptsData sent to saveTransaction:', JSON.stringify(xReceiptsData, null, 2));
    try {
      const savedTransaction = await saveTransaction(xReceiptsData, cardId, { transaction });
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