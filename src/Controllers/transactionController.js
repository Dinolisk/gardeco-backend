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

    // Prepare X-Receipts structure
    const xReceiptsData = {
      xReceipts: {
        schemaVersion: "1.0",
        cashierSystemId: "GARDECO",
        roundTripId: `XRC-${Date.now()}`,
        cardholderReference: cardId,
        generalInformation: {
          receiptType: "DIGITAL_RECEIPT",
          systemTimestamp: transactionData.acquirerTransactionTimestamp,
          receiptNumber: `REC-${Date.now()}`,
          receiptStatus: "COMPLETED",
          receiptTimestamp: transactionData.acquirerTransactionTimestamp
        },
        merchant: {
          merchantName: transactionData.merchantName,
          merchantId: transactionData.paymentCard?.acquirerMerchantIds?.acquirerMerchantId,
          merchantAddress: {
            street: "Testgatan 1",
            city: "Stockholm",
            postalCode: "12345",
            country: "SE"
          }
        },
        branch: {
          branchName: transactionData.merchantName,
          branchId: transactionData.paymentCard?.acquirerMerchantIds?.acquirerMerchantId,
          branchAddress: {
            street: "Testgatan 1",
            city: "Stockholm",
            postalCode: "12345",
            country: "SE"
          }
        },
        lineItems: [{
          itemName: "Test Product",
          itemDescription: "Test Description",
          itemIds: {
            id: "TEST001",
            ean: "1234567890123"
          },
          itemPrice: {
            priceIncVat: transactionData.transactionAmount.merchantTransactionAmount.toString(),
            priceExcVat: (transactionData.transactionAmount.merchantTransactionAmount / 1.25).toString(),
            vatRate: "25.00",
            vatAmount: (transactionData.transactionAmount.merchantTransactionAmount - (transactionData.transactionAmount.merchantTransactionAmount / 1.25)).toString()
          },
          quantity: "1.000",
          quantityType: "PCS",
          itemSumTotal: transactionData.transactionAmount.merchantTransactionAmount.toString(),
          itemMetadataList: []
        }],
        orderSummary: {
          currencyIsoCode: transactionData.transactionAmount.merchantTransactionCurrency,
          totalAmountIncVat: transactionData.transactionAmount.merchantTransactionAmount.toString(),
          totalAmountExcVat: (transactionData.transactionAmount.merchantTransactionAmount / 1.25).toString(),
          vatSummary: [{
            vatRate: "25.00",
            vatAmount: (transactionData.transactionAmount.merchantTransactionAmount - (transactionData.transactionAmount.merchantTransactionAmount / 1.25)).toString(),
            amountExcVat: (transactionData.transactionAmount.merchantTransactionAmount / 1.25).toString()
          }]
        },
        payment: [{
          paymentMethod: "CARD",
          paymentType: "CREDIT",
          cardType: transactionData.paymentCard.cardType,
          maskedPan: transactionData.paymentCard.maskedPan[0].maskedPanValue,
          acquirerTerminalId: transactionData.acquirerTerminalId,
          acquirerMerchantId: transactionData.paymentCard?.acquirerMerchantIds?.acquirerMerchantId,
          acquirerTransactionTimestamp: transactionData.acquirerTransactionTimestamp,
          transactionAmount: {
            merchantTransactionAmount: transactionData.transactionAmount.merchantTransactionAmount,
            merchantTransactionCurrency: transactionData.transactionAmount.merchantTransactionCurrency
          },
          transactionIdentifier: {
            authorizationCode: transactionData.transactionIdentifier.authorizationCode,
            systemTraceAuditNumber: transactionData.transactionIdentifier.systemTraceAuditNumber,
            retrievalReferenceNumber: transactionData.transactionIdentifier.retrievalReferenceNumber
          }
        }]
      }
    };

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