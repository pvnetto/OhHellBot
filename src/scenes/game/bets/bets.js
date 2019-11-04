const Scene = require('telegraf/scenes/base');
const BetManager = require('./BetManager');

const bets = new Scene('bets');
let betManager = null;

bets.enter(async (ctx) => {
    await ctx.game.gameManager.distributeCards(ctx);
    betManager = new BetManager(ctx);
    betManager.beginBetPhase(ctx);
});

bets.command('bet', (ctx) => {
    console.log("Betting");
    betManager.bet(ctx);
});

bets.command('bets', (ctx) => betManager.listBets(ctx));
bets.command('scores', (ctx) => console.log("showing scores"));

module.exports = bets;