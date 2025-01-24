const mongoose = require('mongoose');
const resultSchema = new mongoose.Schema({
  userId: { type: String, required: true }, // Reference to the user
  gameId: { type: String, required: true }, // Game identifier
  homeTeam: { type: String, required: true },
  awayTeam: { type: String, required: true },
  pick: { type: String, required: true }, // User's pick (team or over/under)
  type: { type: String, enum: ['spread', 'total', 'moneyline'], required: true }, // Pick type
  spread: { type: Number }, // Spread value (if applicable)
  total: { type: Number }, // Total value (if applicable)
  outcome: { type: String, enum: ['WON', 'LOST'], required: true }, // WIN or LOSS
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Result', resultSchema);