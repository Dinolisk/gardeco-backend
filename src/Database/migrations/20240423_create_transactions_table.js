'use strict';

export default {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('transactions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      schema_version: {
        type: Sequelize.STRING(10),
        allowNull: false
      },
      card_id: {
        type: Sequelize.UUID,
        allowNull: true
      },
      cashier_system_id: {
        type: Sequelize.STRING(9),
        allowNull: false
      },
      round_trip_id: {
        type: Sequelize.UUID,
        allowNull: false
      },
      cardholder_reference: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      acquirer_terminal_id: {
        type: Sequelize.STRING(15),
        allowNull: false
      },
      acquirer_merchant_id: {
        type: Sequelize.STRING(15),
        allowNull: true
      },
      card_type: {
        type: Sequelize.ENUM(
          'BANKAXEPT',
          'VISA',
          'MASTERCARD',
          'DINERS',
          'AMERICAN_EXPRESS',
          'DISCOVER',
          'JCB',
          'UNIONPAY',
          'MAESTRO',
          'UNKNOWN'
        ),
        allowNull: false
      },
      acquirer_transaction_timestamp: {
        type: Sequelize.DATE,
        allowNull: false
      },
      payment: {
        type: Sequelize.JSON,
        allowNull: false
      },
      authorization_code: {
        type: Sequelize.STRING(6),
        allowNull: false
      },
      system_trace_audit_number: {
        type: Sequelize.STRING(12),
        allowNull: true
      },
      retrieval_reference_number: {
        type: Sequelize.STRING(12),
        allowNull: true
      },
      transaction_reference: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      masked_pan: {
        type: Sequelize.STRING(19),
        allowNull: true
      },
      merchant_name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      cardholder_consents: {
        type: Sequelize.JSON,
        allowNull: true
      },
      cardholder_memberships: {
        type: Sequelize.JSON,
        allowNull: true
      },
      xreceipts: {
        type: Sequelize.JSON,
        allowNull: false
      },
      line_items: {
        type: Sequelize.JSON,
        allowNull: false
      },
      order_summary: {
        type: Sequelize.JSON,
        allowNull: false
      },
      xreceipt_status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'PENDING'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('transactions');
  }
}; 