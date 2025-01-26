const mongoose = require('mongoose');
const resultSchema = new mongoose.Schema({
  user: { type: String, required: true }, // Reference to the user
  team: { type: String, required: true },// User's pick (team or over/under)
  spread: { type: Number }, // Spread value (if applicable)
  matchedWager: { type: [Number], default: [0] },
  matchedUserEmail: { type: [String], default: ['NA'] },
  outcome: { type: String, enum: ['WON', 'LOST'], required: true }, // WIN or LOSS
  gameId: { type: String, required: true }, // Game identifier
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Result', resultSchema);