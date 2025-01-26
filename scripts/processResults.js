const axios = require('axios');
const Pick = require('../models/Pick'); // Existing pick model
const Result = require('../models/Result'); // New results model

const ODDS_API_KEY = process.env.ODDS_API_KEY;
const API_URL = process.env.API_URL;

const processResults = async () => {
    try {
      // Fetch NFL final scores
      const nflResponse = await axios.get(`${API_URL}/americanfootball_nfl/scores/?daysFrom=1&apiKey=${ODDS_API_KEY}`);
      const nflGames = nflResponse.data;
  
      // Fetch NBA final scores
      const nbaResponse = await axios.get(`${API_URL}/basketball_nba/scores/?daysFrom=1&apiKey=${ODDS_API_KEY}`);
      const nbaGames = nbaResponse.data;
  
      // Combine NFL and NBA games
      const games = [...nflGames, ...nbaGames];
  
      // Filter recent completed games or process them
      const now = new Date();
      const recentGames = games.filter((game) => {
        if (!game.completed) return false;
  
        const gameCompletedTime = new Date(game.completed);
        const timeDifference = (now - gameCompletedTime) / (1000 * 60); // Difference in minutes
  
        return timeDifference <= 15; // Include games completed in the last 15 minutes
      });
  
      if (!recentGames.length) {
        console.log('No recently completed games to process.');
        return;
      }

      // Fetch matched picks from the database
      const matchedPicks = await Pick.find({ matched: true });
  
      for (const pick of matchedPicks) {
        // Find the game corresponding to the pick by matching gameId
        const game = recentGames.find((g) => g.id === pick.gameId);
  
        if (!game || !game.completed) continue; // Skip incomplete games or missing data
  
        // Extract home and away scores for the game
        const homeScore = game.scores.find((score) => score.name === game.home_team)?.score || 0;
        const awayScore = game.scores.find((score) => score.name === game.away_team)?.score || 0;
  
        let outcome = 'LOST'; // Default outcome
  
        // Determine if the pick's team is the home team
        if (pick.team === game.home_team) {
          // Add spread to the home team's score and compare to away team's score
          if (homeScore + pick.spread > awayScore) {
            outcome = 'WON';
          }
        } else {
          // Add spread to the away team's score and compare to home team's score
          if (awayScore + pick.spread > homeScore) {
            outcome = 'WON';
          }
        }

      // Move the pick to the Results collection
      await Result.create({
        user: pick.user,
        _id: pick._id,
        team: pick.team,
        spread: pick.spread,
        matchedWager: pick.matchedWager,
        matchedUserEmail: pick.matchedUserEmail,
        gameId: pick.gameId,
        outcome,
        createdAt: new Date(),
      });

      // Remove the pick from the Picks collection
      await Pick.findByIdAndDelete(pick._id);
    }

    console.log('Results processed successfully.');
  } catch (error) {
    console.error('Error processing results:', error.message);
  }
};

module.exports = processResults;