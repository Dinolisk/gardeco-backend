import { DataTypes } from 'sequelize';
import { sequelize } from '../Database/db.js';

// --- Model Definition (med export direkt) ---
export const Membership = sequelize.define('Membership', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  card_id: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  membership_id: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  membership_type: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  membership_level: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
  // Notera: Om card_id+membership_id inte är primärnyckel,
  // lägger Sequelize till en 'id'-kolumn som standard.
}, {
  tableName: 'memberships',
  timestamps: true // Använder createdAt/updatedAt
  // Lägg till om du vill ha egna namn:
  // createdAt: 'created_at',
  // updatedAt: 'updated_at'
});

// --- Uppdaterad saveMembership Function ---
// Function to save or update membership information within a transaction
export const saveMembership = async (membershipData, cardId, options = {}) => { // 1. Lägg till options = {}
  try {
    console.log("Saving Membership Data:", { membershipData, cardId });

    const membershipDetails = {
      card_id: cardId,
      membership_id: membershipData.membershipId, // Antag att detta ID finns i membershipData
      membership_type: membershipData.membershipType ?? null,
      membership_level: membershipData.membershipLevel ?? null
    };

    // Grundläggande validering
    if (!membershipDetails.card_id || !membershipDetails.membership_id) {
        throw new Error("Missing card_id or membership_id for saving membership");
    }

    // 2. Skicka med transaction till findOrCreate
    const [membership, created] = await Membership.findOrCreate({
      where: {
        card_id: membershipDetails.card_id,
        membership_id: membershipDetails.membership_id
      },
      defaults: membershipDetails,
      transaction: options.transaction // <-- ÄNDRING HÄR
    });

    // Uppdatera om den hittades men hade annan info (typ/level)
    if (!created) {
      if (membership.membership_type !== membershipDetails.membership_type ||
          membership.membership_level !== membershipDetails.membership_level)
      {
          console.log(`Updating existing membership info for card_id: ${cardId}, membership_id: ${membershipDetails.membership_id}`);
          // 3. Skicka med transaction till update
          await membership.update(membershipDetails, { transaction: options.transaction }); // <-- ÄNDRING HÄR
      }
    }

    console.log(created ? "Membership created" : "Membership found/updated");
    return membership;
  } catch (error) {
    console.error("Error saving membership to database:", error);
    throw error; // Kasta felet vidare för rollback i controllern
  }
};

// Ingen 'export { Membership };' behövs i slutet