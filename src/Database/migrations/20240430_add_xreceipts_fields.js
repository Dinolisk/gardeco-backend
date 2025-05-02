'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('transactions', 'schema_version', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: '1.0'
    });

    await queryInterface.addColumn('transactions', 'cashier_system_id', {
      type: Sequelize.STRING(9),
      allowNull: false
    });

    await queryInterface.addColumn('transactions', 'round_trip_id', {
      type: Sequelize.UUID,
      allowNull: false
    });

    await queryInterface.addColumn('transactions', 'general_information', {
      type: Sequelize.JSON,
      allowNull: false
    });

    await queryInterface.addColumn('transactions', 'merchant', {
      type: Sequelize.JSON,
      allowNull: false
    });

    await queryInterface.addColumn('transactions', 'branch', {
      type: Sequelize.JSON,
      allowNull: false
    });

    await queryInterface.addColumn('transactions', 'payment', {
      type: Sequelize.JSON,
      allowNull: false
    });

    // Uppdatera cardholder_reference till UUID
    await queryInterface.changeColumn('transactions', 'cardholder_reference', {
      type: Sequelize.UUID,
      allowNull: false
    });

    // Gör line_items och order_summary obligatoriska
    await queryInterface.changeColumn('transactions', 'line_items', {
      type: Sequelize.JSON,
      allowNull: false
    });

    await queryInterface.changeColumn('transactions', 'order_summary', {
      type: Sequelize.JSON,
      allowNull: false
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('transactions', 'schema_version');
    await queryInterface.removeColumn('transactions', 'cashier_system_id');
    await queryInterface.removeColumn('transactions', 'round_trip_id');
    await queryInterface.removeColumn('transactions', 'general_information');
    await queryInterface.removeColumn('transactions', 'merchant');
    await queryInterface.removeColumn('transactions', 'branch');
    await queryInterface.removeColumn('transactions', 'payment');

    // Återställ cardholder_reference
    await queryInterface.changeColumn('transactions', 'cardholder_reference', {
      type: Sequelize.STRING,
      allowNull: true
    });

    // Återställ line_items och order_summary
    await queryInterface.changeColumn('transactions', 'line_items', {
      type: Sequelize.JSON,
      allowNull: true
    });

    await queryInterface.changeColumn('transactions', 'order_summary', {
      type: Sequelize.JSON,
      allowNull: true
    });
  }
}; 