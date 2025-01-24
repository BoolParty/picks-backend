const mongoose = require('mongoose');
const pickSchema = new mongoose.Schema({
  user: { type: String, required: true, index: true }, // Index on user
  team: { type: String, required: true },
  type: { type: String, enum: ['spread', 'total', 'moneyline'], required: true },
  spread: { type: String, required: true },
  wager: { type: Number, required: true },
  matched: { type: Boolean, default: false, index: true },
  matchedWager: { type: [Number], default: [0] },
  matchedUserEmail: { type: [String], default: ['NA'] },
  gameId: { type: String, required: true, index: true }, // Optional: Index on gameId
  timestamp: { type: Date, default: Date.now, index: true }, // Optional: Index for sorting by time
});

module.exports = mongoose.model('Pick', pickSchema);