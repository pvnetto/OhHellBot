const Scene = require('telegraf/scenes/base');
const RoundManager = require('./RoundManager');

const round = new Scene('round');
let roundManager = null;

round.enter(async (ctx) => {
    await ctx.reply('Beginning the play round.');
    roundManager = new RoundManager(ctx.game.gameManager);
    await roundManager.startTurn(ctx);
});

round.command('play', (ctx) => roundManager.playCard(ctx));
round.command('strikes', (ctx) => roundManager.listRoundScore(ctx));
round.command('scores', (ctx) => console.log("showing scores"));

module.exports = round;