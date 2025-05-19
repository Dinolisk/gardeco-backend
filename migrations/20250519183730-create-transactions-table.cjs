'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('transactions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      schema_version: {
        type: Sequelize.STRING,
        allowNull: false
      },
      card_id: {
        type: Sequelize.UUID,
        allowNull: false
      },
      cashier_system_id: {
        type: Sequelize.STRING,
        allowNull: false
      },
      round_trip_id: {
        type: Sequelize.UUID,
        allowNull: false
      },
      cardholder_reference: {
        type: Sequelize.STRING,
        allowNull: false
      },
      acquirer_terminal_id: {
        type: Sequelize.STRING,
        allowNull: false
      },
      acquirer_merchant_id: {
        type: Sequelize.STRING,
        allowNull: false
      },
      card_type: {
        type: Sequelize.STRING,
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
        type: Sequelize.STRING,
        allowNull: false
      },
      system_trace_audit_number: {
        type: Sequelize.STRING,
        allowNull: false
      },
      retrieval_reference_number: {
        type: Sequelize.STRING,
        allowNull: false
      },
      transaction_reference: {
        type: Sequelize.STRING,
        allowNull: false
      },
      masked_pan: {
        type: Sequelize.STRING,
        allowNull: false
      },
      merchant_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      cardholder_consents: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: []
      },
      cardholder_memberships: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: []
      },
      line_items: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: []
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
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('transactions');
  }
};
