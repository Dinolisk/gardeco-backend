'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('transactions', 'cardholder_reference', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'X-Receipts cardholder reference'
    });

    await queryInterface.addColumn('transactions', 'line_items', {
      type: Sequelize.JSON,
      allowNull: true,
      comment: 'X-Receipts line items with formatted prices'
    });

    await queryInterface.addColumn('transactions', 'order_summary', {
      type: Sequelize.JSON,
      allowNull: true,
      comment: 'X-Receipts order summary with formatted prices'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('transactions', 'cardholder_reference');
    await queryInterface.removeColumn('transactions', 'line_items');
    await queryInterface.removeColumn('transactions', 'order_summary');
  }
}; 