const Scene = require('telegraf/scenes/base');
const RoundManager = require('../managers/round');

const round = new Scene('round');

round.enter(async (ctx) => {
    const roundManager = new RoundManager(ctx);
    ctx.session.game.roundManager = roundManager;
    await roundManager.startTurn(ctx);
});

round.command('play', (ctx) => ctx.session.game.roundManager.playCard(ctx));
round.command('strikes', (ctx) => ctx.session.game.roundManager.listRoundScore(ctx));
round.command('scores', (ctx) => console.log("showing scores"));
round.on('sticker', async (ctx) => await ctx.session.game.roundManager.playCard(ctx));

module.exports = round;