'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('xreceipts', 'xreceipt_status', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'PENDING'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('xreceipts', 'xreceipt_status');
  }
}; 