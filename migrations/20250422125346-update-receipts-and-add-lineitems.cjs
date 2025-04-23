'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // --- Steg 1: Ändra befintliga kolumner FÖRST ---
      console.log('Renaming receipts.total to total_amount_incl_vat...');
      await queryInterface.renameColumn('receipts', 'total', 'total_amount_incl_vat', { transaction });

      console.log('Changing receipts.total_amount_incl_vat to DECIMAL...');
      await queryInterface.changeColumn('receipts', 'total_amount_incl_vat', {
         type: Sequelize.DECIMAL(10, 2),
         allowNull: false
      }, { transaction });

      console.log('Changing paymentmethods.amount to DECIMAL...');
      await queryInterface.changeColumn('paymentmethods', 'amount', {
         type: Sequelize.DECIMAL(10, 2),
         allowNull: false
      }, { transaction });
      // Lägg till changeColumn för paymentmethods.changeGiven här om den finns/behövs

      // --- Steg 2: Lägg till NYA kolumner i 'receipts' ---
      console.log('Adding new columns to receipts...');
      await queryInterface.addColumn('receipts', 'receipt_number', {
        type: Sequelize.STRING(100),
        allowNull: true // Tillåt NULL temporärt pga UNIQUE constraint senare
      }, { transaction });

      await queryInterface.addColumn('receipts', 'receipt_timestamp', {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      }, { transaction });

      await queryInterface.addColumn('receipts', 'total_amount_excl_vat', {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
      }, { transaction });

      await queryInterface.addColumn('receipts', 'currency_iso_code', {
        type: Sequelize.STRING(3),
        allowNull: false,
        defaultValue: 'XXX',
      }, { transaction });

      await queryInterface.addColumn('receipts', 'transaction_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
      }, { transaction });

      await queryInterface.addColumn('receipts', 'vat_summary', {
        type: Sequelize.JSON,
        allowNull: true,
      }, { transaction });

      // --- Steg 3: Skapa NYA tabellen 'receipt_line_items' ---
      console.log('Creating receipt_line_items table...');
      await queryInterface.createTable('receipt_line_items', {
        id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
        receipt_id: { type: Sequelize.INTEGER, allowNull: false }, // FK läggs till sen
        item_name: { type: Sequelize.STRING(255), allowNull: false },
        item_description: { type: Sequelize.STRING, allowNull: true },
        item_internal_id: { type: Sequelize.STRING, allowNull: true },
        item_ean: { type: Sequelize.STRING, allowNull: true },
        quantity: { type: Sequelize.DECIMAL(10, 3), allowNull: false },
        quantity_type: { type: Sequelize.STRING(10), allowNull: false },
        price_incl_vat: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
        price_excl_vat: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
        vat_rate: { type: Sequelize.DECIMAL(5, 2), allowNull: false },
        vat_amount: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
        discount_amount: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
        discount_percentage: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
        discount_description: { type: Sequelize.STRING, allowNull: true },
        line_total_incl_vat: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
        metadata_bundle_group: { type: Sequelize.STRING, allowNull: true },
        metadata_json: { type: Sequelize.JSON, allowNull: true },
        createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
      }, { transaction });

      // --- Steg 4: Uppdatera befintliga rader & Lägg till Constraints/Indexes ---
      console.log('Updating existing receipt_number for uniqueness...');
      // Ge unika nummer till gamla rader innan UNIQUE constraint läggs på
      await queryInterface.sequelize.query(
         `UPDATE receipts SET receipt_number = CONCAT('OLD_RN_', id) WHERE receipt_number IS NULL`,
          { transaction }
      );

      console.log('Making receipt_number NOT NULL...');
      // Gör kolumnen NOT NULL nu när alla rader har värden
       await queryInterface.changeColumn('receipts', 'receipt_number', {
         type: Sequelize.STRING(100),
         allowNull: false
      }, { transaction });

      console.log('Adding UNIQUE constraint to receipt_number...');
      await queryInterface.addConstraint('receipts', {
         fields: ['receipt_number'],
         type: 'unique',
         name: 'receipt_number_UNIQUE',
         transaction
      });

      console.log('Adding Foreign Key constraint for receipt_line_items.receipt_id...');
      await queryInterface.addConstraint('receipt_line_items', {
         fields: ['receipt_id'],
         type: 'foreign key',
         name: 'fk_lineitems_receipts',
         references: { table: 'receipts', field: 'id' },
         onDelete: 'CASCADE',
         onUpdate: 'CASCADE', // Eller NO ACTION
         transaction
      });

      console.log('Adding Foreign Key constraint for receipts.transaction_id...');
      await queryInterface.addConstraint('receipts', {
         fields: ['transaction_id'],
         type: 'foreign key',
         name: 'fk_receipts_transactions',
         references: { table: 'transactions', field: 'id' },
         onDelete: 'SET NULL', // Eller NO ACTION/RESTRICT
         onUpdate: 'NO ACTION',
         transaction
      });

      console.log('Adding indexes...');
      await queryInterface.addIndex('receipt_line_items', ['receipt_id'], { transaction });
      await queryInterface.addIndex('receipts', ['transaction_id'], { transaction });

      console.log('Committing transaction...');
      await transaction.commit();
      console.log('Migration completed successfully.');

    } catch (err) {
      console.error('Migration failed, rolling back...', err);
      await transaction.rollback();
      throw err;
    }
  },

  async down (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      console.log('Reverting migration...');
      // Ta bort i motsatt ordning som de lades till
      console.log('Removing indexes...');
      await queryInterface.removeIndex('receipts', ['transaction_id'], { transaction });
      await queryInterface.removeIndex('receipt_line_items', ['receipt_id'], { transaction });

      console.log('Removing constraints...');
      await queryInterface.removeConstraint('receipts', 'fk_receipts_transactions', { transaction });
      await queryInterface.removeConstraint('receipt_line_items', 'fk_lineitems_receipts', { transaction });
      await queryInterface.removeConstraint('receipts', 'receipt_number_UNIQUE', { transaction });

      console.log('Dropping receipt_line_items table...');
      await queryInterface.dropTable('receipt_line_items', { transaction });

      console.log('Removing columns from receipts...');
      await queryInterface.removeColumn('receipts', 'vat_summary', { transaction });
      await queryInterface.removeColumn('receipts', 'transaction_id', { transaction });
      await queryInterface.removeColumn('receipts', 'currency_iso_code', { transaction });
      await queryInterface.removeColumn('receipts', 'total_amount_excl_vat', { transaction });
      await queryInterface.removeColumn('receipts', 'receipt_timestamp', { transaction });
      await queryInterface.removeColumn('receipts', 'receipt_number', { transaction });

      console.log('Reverting column changes...');
      await queryInterface.changeColumn('paymentmethods', 'amount', {
        type: Sequelize.INTEGER, // Tillbaka till INTEGER
        allowNull: false
      }, { transaction });
      // Lägg till revert för changeGiven här om nödvändigt

      await queryInterface.changeColumn('receipts', 'total_amount_incl_vat', {
         type: Sequelize.INTEGER, // Tillbaka till INTEGER
         allowNull: false
      }, { transaction });
      await queryInterface.renameColumn('receipts', 'total_amount_incl_vat', 'total', { transaction });

      console.log('Committing revert transaction...');
      await transaction.commit();
      console.log('Revert completed successfully.');
    } catch (err) {
      console.error('Revert failed, rolling back revert transaction...', err);
      await transaction.rollback();
      throw err;
    }
  }
};