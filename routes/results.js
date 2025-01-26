const express = require('express');
const Result = require('../models/Result'); // Import the Result model
const router = express.Router();

// GET /api/results/:userEmail - Fetch results for a specific user
router.get('/:userEmail', async (req, res) => {
  try {
    const { userEmail } = req.params;

    // Fetch results from the database for the given user
    const results = await Result.find({ user: userEmail });

    if (!results.length) {
      return res.status(200).json([]); // Return an empty array if no results
    }

    res.status(200).json(results);
  } catch (error) {
    console.error('Error fetching results:', error.message);
    res.status(500).json({ error: 'Failed to fetch results. Please try again later.' });
  }
});

module.exports = router;
