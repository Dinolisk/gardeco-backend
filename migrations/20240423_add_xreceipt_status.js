export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('transactions', 'xreceipt_status', {
    type: Sequelize.ENUM('PENDING', 'MATCHED', 'NOT_ELIGIBLE'),
    defaultValue: 'PENDING',
    allowNull: false,
    after: 'merchant_name'  // Add it after the merchant_name column
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.removeColumn('transactions', 'xreceipt_status');
  await queryInterface.sequelize.query('DROP TYPE enum_transactions_xreceipt_status;');
} 