'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.addColumn(
        'transactions',
        'cardholder_reference',
        {
          type: Sequelize.STRING,
          allowNull: true,
          comment: 'X-Receipts cardholder reference'
        },
        { transaction }
      );

      await queryInterface.addColumn(
        'transactions',
        'line_items',
        {
          type: Sequelize.JSON,
          allowNull: true,
          comment: 'X-Receipts line items with formatted prices'
        },
        { transaction }
      );

      await queryInterface.addColumn(
        'transactions',
        'order_summary',
        {
          type: Sequelize.JSON,
          allowNull: true,
          comment: 'X-Receipts order summary with formatted prices'
        },
        { transaction }
      );

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  async down (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.removeColumn('transactions', 'cardholder_reference', { transaction });
      await queryInterface.removeColumn('transactions', 'line_items', { transaction });
      await queryInterface.removeColumn('transactions', 'order_summary', { transaction });

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
}; 