import { sequelize } from './db.js';

const fixColumn = async () => {
  try {
    await sequelize.query(`ALTER TABLE transactions MODIFY cardholder_reference VARCHAR(255) NOT NULL DEFAULT 'DEFAULT_REF';`);
    console.log('Default value for cardholder_reference set successfully!');
  } catch (error) {
    console.error('Error updating cardholder_reference:', error);
  } finally {
    await sequelize.close();
  }
};

fixColumn(); 