const Scene = require('telegraf/scenes/base');
const BetManager = require('./BetManager');

const bets = new Scene('bets');
let betManager = null;

bets.enter(async (ctx) => {
    await ctx.game.gameManager.distributeCards(ctx);
    betManager = new BetManager(ctx);
    await betManager.beginBetPhase(ctx);
});

bets.command('bet', (ctx) => {
    betManager.bet(ctx);
});
bets.command('bets', (ctx) => betManager.listBets(ctx));
bets.command('scores', (ctx) => console.log("showing scores"));

module.exports = bets;