// Request 1: Basic transaction with receipt
export const request1 = {
  transaction: {
    acquirer_terminal_id: "TERM001",
    acquirer_transaction_timestamp: new Date().toISOString(),
    transaction_amount: 299.90,
    transaction_currency: "NOK",
    authorization_code: "AUTH123",
    system_trace_audit_number: "123456",
    retrieval_reference_number: "987654321",
    card_type: "VISA",
    masked_pan: "************1234",
    acquirer_merchant_id: "MERCH001",
    merchant_name: "Test Store",
    cardholder_reference: "CUST12345",
    line_items: [
      {
        itemName: "Test Product",
        quantity: 1,
        unitPrice: 299.90,
        totalPrice: 299.90,
        vatRate: 25.00,
        vatAmount: 59.98
      }
    ],
    order_summary: {
      totalAmount: 299.90,
      totalVatAmount: 59.98,
      currency: "NOK",
      numberOfItems: 1
    }
  },
  receipt: {
    receipt_number: `TEST-REC-${Date.now()}`,
    receipt_timestamp: new Date().toISOString(),
    total_amount_incl_vat: 299.90,
    total_amount_excl_vat: 239.92,
    currency_iso_code: "NOK",
    vat_summary: [
      {
        vatRate: 25.00,
        vatAmount: 59.98
      }
    ],
    line_items: [
      {
        item_name: "Test Product",
        item_description: "A test product",
        item_internal_id: "TEST001",
        item_ean: "5901234123457",
        quantity: 1,
        quantity_type: "PCS",
        price_incl_vat: 299.90,
        price_excl_vat: 239.92,
        vat_rate: 25.00,
        vat_amount: 59.98,
        line_total_incl_vat: 299.90
      }
    ],
    payment_methods: [
      {
        method: "CARD",
        amount: 299.90,
        label: "VISA ****1234",
        cardType: "VISA",
        last4: "1234",
        timestamp: new Date().toISOString(),
        details: {
          terminalId: "TERM001",
          merchantId: "MERCH001",
          authCode: "AUTH123"
        }
      }
    ]
  }
};

// Request 2: Transaction with multiple items and discounts
export const request2 = {
  transaction: {
    acquirer_terminal_id: "TERM002",
    acquirer_transaction_timestamp: new Date().toISOString(),
    transaction_amount: 599.80,
    transaction_currency: "NOK",
    authorization_code: "AUTH456",
    system_trace_audit_number: "789012",
    retrieval_reference_number: "987654322",
    card_type: "MASTERCARD",
    masked_pan: "************5678",
    acquirer_merchant_id: "MERCH002",
    merchant_name: "Test Store 2",
    cardholder_reference: "CUST67890",
    line_items: [
      {
        itemName: "Product A",
        quantity: 2,
        unitPrice: 199.90,
        totalPrice: 399.80,
        vatRate: 25.00,
        vatAmount: 79.96
      },
      {
        itemName: "Product B",
        quantity: 1,
        unitPrice: 199.90,
        totalPrice: 199.90,
        vatRate: 25.00,
        vatAmount: 39.98,
        discount: {
          amount: 20.00,
          percentage: 10,
          description: "Summer Sale"
        }
      }
    ],
    order_summary: {
      totalAmount: 599.80,
      totalVatAmount: 119.94,
      currency: "NOK",
      numberOfItems: 3,
      discounts: {
        totalDiscountAmount: 20.00,
        items: [
          {
            itemName: "Product B",
            discountAmount: 20.00,
            discountPercentage: 10
          }
        ]
      }
    }
  },
  receipt: {
    receipt_number: `TEST-REC-${Date.now()}-2`,
    receipt_timestamp: new Date().toISOString(),
    total_amount_incl_vat: 599.80,
    total_amount_excl_vat: 479.84,
    currency_iso_code: "NOK",
    vat_summary: [
      {
        vatRate: 25.00,
        vatAmount: 119.94
      }
    ],
    line_items: [
      {
        item_name: "Product A",
        item_description: "First test product",
        item_internal_id: "TEST002",
        item_ean: "5901234123458",
        quantity: 2,
        quantity_type: "PCS",
        price_incl_vat: 199.90,
        price_excl_vat: 159.92,
        vat_rate: 25.00,
        vat_amount: 39.98,
        line_total_incl_vat: 399.80
      },
      {
        item_name: "Product B",
        item_description: "Second test product",
        item_internal_id: "TEST003",
        item_ean: "5901234123459",
        quantity: 1,
        quantity_type: "PCS",
        price_incl_vat: 199.90,
        price_excl_vat: 159.92,
        vat_rate: 25.00,
        vat_amount: 39.98,
        discount_amount: 20.00,
        discount_percentage: 10,
        discount_description: "Summer Sale",
        line_total_incl_vat: 179.90
      }
    ],
    payment_methods: [
      {
        method: "CARD",
        amount: 599.80,
        label: "MASTERCARD ****5678",
        cardType: "MASTERCARD",
        last4: "5678",
        timestamp: new Date().toISOString(),
        details: {
          terminalId: "TERM002",
          merchantId: "MERCH002",
          authCode: "AUTH456"
        }
      }
    ]
  }
}; 