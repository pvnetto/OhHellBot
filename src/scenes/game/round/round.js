const Scene = require('telegraf/scenes/base');
const RoundManager = require('./RoundManager');

const round = new Scene('round');

round.enter(async ({ session, telegram, reply }) => {
    const roundManager = new RoundManager({ session });
    session.game.roundManager = roundManager;

    await roundManager.startTurn({ session, telegram, reply });
});

round.command('play', (ctx) => ctx.session.game.roundManager.playCard(ctx));
round.command('strikes', (ctx) => ctx.session.game.roundManager.listRoundScore(ctx));
round.command('scores', (ctx) => console.log("showing scores"));
round.on('sticker', async (ctx) => await ctx.session.game.roundManager.playCard(ctx));

module.exports = round;