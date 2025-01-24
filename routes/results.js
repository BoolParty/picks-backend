const express = require('express');
const Result = require('../models/Result'); // Import the Result model
const router = express.Router();

// GET /api/result/:userId - Fetch results for a specific user
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Fetch results from the database for the given user
    const results = await Results.find({ userId });

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
