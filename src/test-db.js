import { sequelize } from './Database/db.js';
import { Receipt, PaymentMethod } from './Models/receiptModel.js';
import { Transaction } from './Models/transactionModel.js';
import { Card } from './Models/cardModel.js';
import { Membership } from './Models/membershipModel.js';

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const initializeDatabase = async (retryCount = 0) => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');

    // Sync all models with { force: false } to preserve existing data
    await sequelize.sync({ force: false });
    console.log('✅ Database synchronized successfully');
    return true;
  } catch (err) {
    console.error(`❌ Error during database initialization (attempt ${retryCount + 1}):`, err.message);
    
    if (err.original?.code === 'ER_LOCK_DEADLOCK' && retryCount < MAX_RETRIES) {
      console.log(`Retrying in ${RETRY_DELAY/1000} seconds...`);
      await sleep(RETRY_DELAY);
      return initializeDatabase(retryCount + 1);
    }
    
    return false;
  }
};

const testDatabase = async () => {
  try {
    console.log('Starting database tests...');

    // Initialize database first
    const initialized = await initializeDatabase();
    if (!initialized) {
      console.error('Failed to initialize database. Stopping tests.');
      return;
    }

    // Test 1: Create a Receipt and PaymentMethod
    console.log('\nTesting Receipt and PaymentMethod creation...');
    const receipt = await Receipt.create({
      total: 2000 // 20.00 SEK - different amount to show it's new data
    });
    console.log('✅ Receipt created:', receipt.id);

    const paymentMethod = await PaymentMethod.create({
      receipt_id: receipt.id,
      method: 'CARD',
      amount: 2000,
      label: 'Test Card Payment 2',
      cardType: 'MASTERCARD',
      last4: '5678'
    });
    console.log('✅ PaymentMethod created:', paymentMethod.id);

    // Test 2: Create Card if it doesn't exist
    console.log('\nTesting Card creation...');
    const [card, createdCard] = await Card.findOrCreate({
      where: { cardId: 'TEST_CARD_002' },
      defaults: {
        maskedPan: '************5678',
        cardType: 'MASTERCARD'
      }
    });
    console.log(createdCard ? '✅ Card created for card:' : '✅ Card already exists for card:', card.cardId);

    // Test 3: Create Membership if it doesn't exist
    console.log('\nTesting Membership creation...');
    const [membership, createdMembership] = await Membership.findOrCreate({
      where: { membership_id: 'MEM_002' },
      defaults: {
        card_id: 'TEST_CARD_002',
        membership_type: 'PREMIUM',
        membership_level: 'PLATINUM'
      }
    });
    console.log(createdMembership ? '✅ Membership created:' : '✅ Membership already exists:', membership.membership_id);

    // Test 4: Create Transaction if it doesn't exist
    console.log('\nTesting Transaction creation...');
    const [transaction, createdTransaction] = await Transaction.findOrCreate({
      where: { retrieval_reference_number: 'REF456' }, // different reference
      defaults: {
        card_id: 'TEST_CARD_002',
        acquirer_terminal_id: 'TERM002', // different terminal
        card_type: 'MASTERCARD',
        transaction_amount: 2000,
        transaction_currency: 'SEK',
        masked_pan: '************5678',
        merchant_name: 'Test Store 2' // different store
      }
    });
    console.log(createdTransaction ? '✅ Transaction created:' : '✅ Transaction already exists:', transaction.id);

    // Test 5: Verify existing data
    console.log('\nVerifying existing data...');
    
    const allReceipts = await Receipt.findAll();
    console.log('Total Receipts in database:', allReceipts.length);
    
    const allTransactions = await Transaction.findAll();
    console.log('Total Transactions in database:', allTransactions.length);
    
    const allCards = await Card.findAll();
    console.log('Total Cards in database:', allCards.length);
    
    const allMemberships = await Membership.findAll();
    console.log('Total Memberships in database:', allMemberships.length);

    console.log('\n✅ All database tests completed successfully!');
  } catch (error) {
    console.error('❌ Error during database testing:', error);
  } finally {
    // Close the database connection
    await sequelize.close();
  }
};

// Run the tests
testDatabase();
