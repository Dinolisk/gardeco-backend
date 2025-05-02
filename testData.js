// Test data för steg 1 (transaktion)
const testData = {
    xReceipts: {
        schemaVersion: "1.0",
        cashierSystemId: "SE556677889901", // Momsregistreringsnummer
        roundTripId: "550e8400-e29b-41d4-a716-446655440000", // Nytt UUID för varje transaktion
        cardholderReference: "550e8400-e29b-41d4-a716-446655440000", // Samma som cardId
        generalInformation: {
            receiptType: "DIGITAL_RECEIPT",
            systemTimestamp: "2024-03-20T10:30:00Z",
            receiptNumber: "123456",
            receiptStatus: "COMPLETED",
            receiptTimestamp: "2024-03-20T10:30:00Z"
        },
        merchant: {
            merchantName: "Test Merchant",
            merchantId: "1234567890",
            merchantAddress: {
                street: "Testgatan 1",
                city: "Stockholm",
                postalCode: "12345",
                country: "SE"
            }
        },
        branch: {
            branchName: "Test Branch",
            branchId: "1234567890",
            branchAddress: {
                street: "Testgatan 1",
                city: "Stockholm",
                postalCode: "12345",
                country: "SE"
            }
        },
        lineItems: [
            {
                itemName: "Test Product",
                itemDescription: "Test Description",
                itemIds: {
                    id: "12345",
                    ean: "1234567890123"
                },
                itemPrice: {
                    priceIncVat: 100.00,
                    priceExcVat: 80.00,
                    vatRate: "25.00",
                    vatAmount: 20.00
                },
                quantity: "1.000",
                quantityType: "PCS",
                itemSumTotal: 100.00,
                itemMetadataList: []
            }
        ],
        orderSummary: {
            currencyIsoCode: "SEK",
            totalAmountIncVat: 100.00,
            totalAmountExcVat: 80.00,
            vatSummary: [
                {
                    vatRate: "25.00",
                    vatAmount: 20.00,
                    amountExcVat: 80.00
                }
            ]
        },
        payment: [
            {
                paymentMethod: "CARD",
                paymentType: "CREDIT",
                cardType: "VISA",
                maskedPan: "************1234",
                acquirerTerminalId: "12345678",
                acquirerMerchantId: "1234567890",
                acquirerTransactionTimestamp: "2024-03-20T10:30:00Z",
                transactionAmount: {
                    merchantTransactionAmount: 100.00,
                    merchantTransactionCurrency: "SEK"
                },
                transactionIdentifier: {
                    authorizationCode: "123456",
                    systemTraceAuditNumber: "123456",
                    retrievalReferenceNumber: "123456789012"
                }
            }
        ]
    }
};

// Test data för steg 2 (kvitto)
const testReceiptData = {
    xReceipts: {
        schemaVersion: "1.0",
        cashierSystemId: "SE556677889901",
        roundTripId: "550e8400-e29b-41d4-a716-446655440000",
        cardholderReference: "550e8400-e29b-41d4-a716-446655440000",
        generalInformation: {
            receiptType: "DIGITAL_RECEIPT",
            systemTimestamp: "2024-03-20T10:30:00Z",
            receiptNumber: "123456",
            receiptStatus: "COMPLETED",
            receiptTimestamp: "2024-03-20T10:30:00Z"
        },
        merchant: {
            merchantName: "Test Merchant",
            merchantId: "1234567890",
            merchantAddress: {
                street: "Testgatan 1",
                city: "Stockholm",
                postalCode: "12345",
                country: "SE"
            }
        },
        branch: {
            branchName: "Test Branch",
            branchId: "1234567890",
            branchAddress: {
                street: "Testgatan 1",
                city: "Stockholm",
                postalCode: "12345",
                country: "SE"
            }
        },
        lineItems: [
            {
                itemName: "Test Product",
                itemDescription: "Test Description",
                itemIds: {
                    id: "12345",
                    ean: "1234567890123"
                },
                itemPrice: {
                    priceIncVat: 100.00,
                    priceExcVat: 80.00,
                    vatRate: "25.00",
                    vatAmount: 20.00
                },
                quantity: "1.000",
                quantityType: "PCS",
                itemSumTotal: 100.00,
                itemMetadataList: []
            }
        ],
        orderSummary: {
            currencyIsoCode: "SEK",
            totalAmountIncVat: 100.00,
            totalAmountExcVat: 80.00,
            vatSummary: [
                {
                    vatRate: "25.00",
                    vatAmount: 20.00,
                    amountExcVat: 80.00
                }
            ]
        },
        payment: [
            {
                paymentMethod: "CARD",
                paymentType: "CREDIT",
                cardType: "VISA",
                maskedPan: "************1234",
                acquirerTerminalId: "12345678",
                acquirerMerchantId: "1234567890",
                acquirerTransactionTimestamp: "2024-03-20T10:30:00Z",
                transactionAmount: {
                    merchantTransactionAmount: 100.00,
                    merchantTransactionCurrency: "SEK"
                },
                transactionIdentifier: {
                    authorizationCode: "123456",
                    systemTraceAuditNumber: "123456",
                    retrievalReferenceNumber: "123456789012"
                }
            }
        ]
    }
};

module.exports = { testData, testReceiptData }; 