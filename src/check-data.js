import { sequelize, Receipt, PaymentMethod } from './Models/receiptModel.js';
import { Transaction } from './Models/transactionModel.js';
import { Card } from './Models/cardModel.js';
import { Membership } from './Models/membershipModel.js';

const checkData = async () => {
  try {
    console.log('Checking all data in database...\n');

    // Check Receipts
    const receipts = await Receipt.findAll({
      include: [PaymentMethod]  // Include associated payment methods
    });
    console.log('Receipts found:', receipts.length);
    receipts.forEach(receipt => {
      console.log(`Receipt ID: ${receipt.id}`);
      console.log(`- Total: ${receipt.total}`);
      console.log(`- Created at: ${receipt.createdAt}`);
      console.log('- Payment Methods:', receipt.PaymentMethods?.length || 0);
      console.log('---');
    });

    // Check Transactions
    const transactions = await Transaction.findAll();
    console.log('\nTransactions found:', transactions.length);
    transactions.forEach(trans => {
      console.log(`Transaction ID: ${trans.id}`);
      console.log(`- Card ID: ${trans.card_id}`);
      console.log(`- Amount: ${trans.transaction_amount}`);
      console.log(`- Created at: ${trans.created_at}`);
      console.log('---');
    });

    // Check Cards
    const cards = await Card.findAll();
    console.log('\nCards found:', cards.length);
    cards.forEach(card => {
      console.log(`Card ID: ${card.cardId}`);
      console.log(`- Type: ${card.cardType}`);
      console.log(`- Created at: ${card.createdAt}`);
      console.log('---');
    });

    // Check Memberships
    const memberships = await Membership.findAll();
    console.log('\nMemberships found:', memberships.length);
    memberships.forEach(member => {
      console.log(`Membership ID: ${member.membership_id}`);
      console.log(`- Card ID: ${member.card_id}`);
      console.log(`- Type: ${member.membership_type}`);
      console.log(`- Level: ${member.membership_level}`);
      console.log(`- Created at: ${member.createdAt}`);
      console.log('---');
    });

  } catch (error) {
    console.error('Error checking data:', error);
  } finally {
    await sequelize.close();
  }
};

checkData();
