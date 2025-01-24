const axios = require('axios');
const Pick = require('../models/Pick'); // Existing pick model
const Result = require('../models/Result'); // New results model

const ODDS_API_KEY = process.env.ODDS_API_KEY;
const ODDS_API_URL = process.env.API_URL;

const processResults = async () => {
  try {
    // Fetch final scores from the Odds API
    const { data: games } = await axios.get(`${ODDS_API_URL}?apiKey=${ODDS_API_KEY}&daysFrom=1`);

    // Fetch matched picks from the database
    const matchedPicks = await Pick.find({ matched: true });

    for (const pick of matchedPicks) {
      const game = games.find((g) => g.home_team === pick.homeTeam && g.away_team === pick.awayTeam);

      if (!game || !game.completed) continue; // Skip incomplete games

      if (!games || games.length === 0) {
        console.log('No completed games to process.');
        return;
      }

      const homeScore = game.scores.find((score) => score.name === pick.homeTeam)?.score || 0;
      const awayScore = game.scores.find((score) => score.name === pick.awayTeam)?.score || 0;

      let outcome = 'LOST';

      // Evaluate the pick's outcome
      if (pick.type === 'spread') {
        const teamScore = pick.pick === pick.homeTeam ? homeScore : awayScore;
        const opponentScore = pick.pick === pick.homeTeam ? awayScore : homeScore;
        const adjustedScore = teamScore + pick.spread;

        if (adjustedScore > opponentScore) outcome = 'WON';
      } else if (pick.type === 'total') {
        const totalScore = homeScore + awayScore;
        if ((pick.totalType === 'over' && totalScore > pick.total) || (pick.totalType === 'under' && totalScore < pick.total)) {
          outcome = 'WON';
        }
      }

      // Move the pick to the Results collection
      await Result.create({
        userId: pick.userId,
        gameId: pick.gameId,
        homeTeam: pick.homeTeam,
        awayTeam: pick.awayTeam,
        pick: pick.pick,
        type: pick.type,
        spread: pick.spread,
        total: pick.total,
        outcome,
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