const express = require('express');
const Pick = require('../models/Pick');
const router = express.Router();

// Add a new pick
router.post('/', async (req, res) => {
  try {
    const picks = req.body; // Expecting an array of picks

    // Validate that it's an array
    if (!Array.isArray(picks)) {
      return res.status(400).json({ error: 'Expected an array of picks' });
    }

    // Process each pick individually
    const savedPicks = [];
    for (const pick of picks) {
      const { gameId, team, spread, wager, user, timestamp } = pick;

      // Validate required fields for each pick
      if (!gameId || !team || spread === undefined || !wager || !user || !timestamp) {
        return res.status(400).json({ error: 'All fields are required for each pick' });
      }
      if (typeof wager !== 'number' || wager <= 0) {
        return res.status(400).json({ error: 'Wager must be a positive number' });
      }

      // Validate gameId is a string
      if (typeof gameId !== 'string' || gameId.trim() === '') {
        return res.status(400).json({ error: 'Invalid gameId' });
      }

      // Ensure 'matched' defaults to false for new picks
      const newPick = new Pick({
        gameId,
        team,
        spread,
        wager,
        user,
        timestamp,
        matched: false, // Explicitly set to false for new picks
        matchedWager: 0, // Initialize matchedWager as 0
        matchedUserEmail: 'NA', // Ensure the unmatched pick has 'NA' as matchedUserEmail
      });

      // Save the pick
      const savedPick = await newPick.save();
      savedPicks.push(savedPick); // Collect the saved pick
    }

    console.log('All picks saved:', savedPicks);
    res.status(201).json(savedPicks); // Return all saved picks
  } catch (err) {
    console.error('Error saving picks:', err.message);
    res.status(400).json({ error: err.message });
  }
});

// Get unmatched picks for a user
router.get('/unmatched/:userEmail', async (req, res) => {
  try {
    // Log the incoming request and the userEmail parameter
    console.log(`Fetching unmatched picks for: ${req.params.userEmail}`);

    const { userEmail } = req.params;

    // Query the database for unmatched picks for this user
    const unmatchedPicks = await Pick.find({ user: userEmail, matched: false })
      .sort({ timestamp: -1 }); // Sort by timestamp in descending order

    // Log the result of the query for debugging
    console.log('Unmatched picks retrieved:', unmatchedPicks);

    // Send the unmatched picks as a JSON response
    res.status(200).json(unmatchedPicks);
  } catch (err) {
    // Log any errors
    console.error('Error fetching unmatched picks:', err.message);

    // Send an error response
    res.status(500).json({ error: 'Failed to fetch unmatched picks' });
  }
});

// Get matched picks for a user
router.get('/matched/:userEmail', async (req, res) => {
  try {
    const { userEmail } = req.params;

    // Find matched picks for the user where wager > 0 and matched is true
    const matchedPicks = await Pick.find({ user: userEmail, matched: true, wager: { $gt: 0 }})
      .sort({ timestamp: -1 });

    // Log the matched picks to check if the data is correct
    console.log('Matched picks fetched from DB:', matchedPicks);

    // Directly process the matched picks and ensure that matchedUserEmail and matchedWager are correctly set
    const picksWithMatchedUserEmail = matchedPicks.map((pick) => {
      // If this is a partially matched pick, the matchedUserEmail and matchedWager should already be correct.
      // No need for another database query here
      if (pick.matchedUserEmail && pick.matchedWager) {
        // Log for debugging if necessary
        console.log('Matched pick data for user:', pick);
      }

      return pick;
    });

console.log("Matched picks data before sending:", picksWithMatchedUserEmail);  // Log data to check before sending

// Send data to the client
res.status(200).json(picksWithMatchedUserEmail);
  } catch (err) {
    console.error('Error fetching matched picks:', err.message);
    res.status(500).json({ error: 'Failed to fetch matched picks' });
  }
});

module.exports = router;