require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cron = require('node-cron');
const pickRoutes = require('./routes/picks');
const Pick = require('./models/Pick');
const cors = require('cors');
const { sendMatchEmail } = require('./email');

const app = express();

const allowedOrigins = ['https://pickparty.net', 'https://www.pickparty.net/', 'http://localhost:3000'];

// Middleware
app.use(express.json());
app.use(cors({
  origin: allowedOrigins, // Allow only requests from the specified domain
  methods: ['GET', 'POST'], // Adjust methods as needed
  credentials: true,
}));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/picks', pickRoutes);

// Pairing Script (runs every minute)
cron.schedule('*/1 * * * *', async () => {
  console.log('Running pairing script...');
  try {
    // Fetch unmatched picks sorted by timestamp (earliest first)
    const unmatchedPicks = await Pick.find({ matched: false }).sort({ timestamp: 1 });

    for (let i = 0; i < unmatchedPicks.length; i++) {
      const pick1 = unmatchedPicks[i];

      // Skip if already matched
      if (pick1.matched) continue;

      for (let j = i + 1; j < unmatchedPicks.length; j++) {
        const pick2 = unmatchedPicks[j];

        // Skip if already matched
        if (pick2.matched) continue;


        // Match criteria: Same game, opposite teams, different users
        if (
          pick1.gameId === pick2.gameId && // Same game
          pick1.team !== pick2.team && // Opposite teams
          pick1.user !== pick2.user // Different users
        ) {
          const matchAmount = Math.min(pick1.wager, pick2.wager);

          // Calculate the new spread difference and ensure it is within the threshold of 2
          const spreadDifference = Math.abs(Math.abs(pick1.spread) - Math.abs(pick2.spread));

          // If the spread difference is less than or equal to 2, adjust User A's spread
          if (spreadDifference <= 2) {
            // Adjust User A's spread to match the opposite value of User B's spread
            pick1.spread = -pick2.spread; // Update User A's spread to match User B's pick
            pick1.matchedUserEmail = pick2.user; // Assign matched user's email for pick1
          }

          // Logic to partially match pick1
          if (pick1.wager > matchAmount) {
            // Create a new unmatched pick for pick1 with the remaining wager
            const newPick1 = new Pick({
              gameId: pick1.gameId,
              team: pick1.team,
              spread: pick1.spread,
              wager: pick1.wager - matchAmount,
              matchedWager: matchAmount, // Store matched wager
              user: pick1.user,
              timestamp: new Date(pick1.timestamp), // Preserve original timestamp
              matched: false, // New pick is unmatched
              matchedUserEmail: "NA", // Ensure unmatched pick has "NA" for matchedUserEmail
            });
            await newPick1.save(); // Save the new unmatched pick for pick1
            pick1.wager -= matchAmount; // Adjust original pick1 wager to remaining amount
            pick1.matchedWager.push(matchAmount); // Store matched wager for pick1
            pick1.matchedUserEmail.push(pick2.user); // Ensure the partial match reflects the matched user's email
          } else {
            pick1.matched = true; // Fully matched pick1
            pick1.matchedWager = pick1.wager; // All wager matched
            pick1.matchedUserEmail.push(pick2.user); // Assign matched user's email for fully matched pick
          }

          // Logic to partially match pick2
          if (pick2.wager > matchAmount) {
            // Create a new unmatched pick for pick2 with the remaining wager
            const newPick2 = new Pick({
              gameId: pick2.gameId,
              team: pick2.team,
              spread: pick2.spread,
              wager: pick2.wager - matchAmount,
              matchedWager: matchAmount, // Store matched wager
              user: pick2.user,
              timestamp: new Date(pick2.timestamp), // Preserve original timestamp
              matched: false, // New pick is unmatched
              matchedUserEmail: "NA", // Ensure unmatched pick has "NA" for matchedUserEmail
            });
            await newPick2.save(); // Save the new unmatched pick for pick2
            pick2.wager -= matchAmount; // Adjust original pick2 wager to remaining amount
            pick2.matchedWager.push(matchAmount); // Store matched wager for pick2
            pick2.matchedUserEmail.push(pick1.user); // Assign matched user's email for fully matched portion
          } else {
            pick2.matched = true; // Fully matched pick2
            pick2.matchedWager = pick2.wager; // All wager matched
            pick2.matchedUserEmail.push(pick1.user); // Assign matched user's email for fully matched pick
          }

          // **EDIT: Ensure that matched pick's matched status is true**
          if (!pick1.matched) pick1.matched = true; // **set matched flag for matched pick1**
          if (!pick2.matched) pick2.matched = true; // **set matched flag for matched pick2**

          // Save both matched or partially matched picks
          await pick1.save();
          await pick2.save();

          // Send email notification after both picks are matched
          if (pick1.matched) sendMatchEmail(pick1.user, pick1); // Send email to User 1
          if (pick2.matched) sendMatchEmail(pick2.user, pick2); // Send email to User 2

          console.log(
            `Matched pick ${pick1._id} (team: ${pick1.team}) with pick ${pick2._id} (team: ${pick2.team}) for $${matchAmount}`
          );

          // Break inner loop if pick1 is fully matched
          if (pick1.matched) break;
        }
      }
    }
  } catch (err) {
    console.error('Error running pairing script:', err);
  }
});

// Catch-all route for React
// app.use((req, res) => {
//   res.status(404).send('Page not found');
// });

// Start Server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));