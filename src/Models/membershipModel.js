import { DataTypes } from 'sequelize';
import { sequelize } from '../Database/db.js';

const Membership = sequelize.define('Membership', {
  card_id: {
    type: DataTypes.STRING,
    allowNull: false
  },
  membership_id: {
    type: DataTypes.STRING,
    allowNull: false
  },
  membership_type: {
    type: DataTypes.STRING,
    allowNull: true
  },
  membership_level: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'memberships',
  timestamps: true
});

// Function to save membership information
export const saveMembership = async (membershipData, cardId) => {
  try {
    console.log("Saving Membership Data:", { membershipData, cardId });

    const membershipDetails = {
      card_id: cardId,
      membership_id: membershipData.membershipId,
      membership_type: membershipData.membershipType ?? null,
      membership_level: membershipData.membershipLevel ?? null
    };

    const [membership, created] = await Membership.findOrCreate({
      where: {
        card_id: cardId,
        membership_id: membershipData.membershipId
      },
      defaults: membershipDetails
    });

    // If membership exists but has different info, update it
    if (!created) {
      await membership.update(membershipDetails);
    }

    console.log(created ? "Membership created" : "Membership updated");
    return membership;
  } catch (error) {
    console.error("Error saving membership to database:", error);
    throw error;
  }
};

export { Membership };
