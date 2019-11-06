const Scene = require('telegraf/scenes/base');
const RoundManager = require('./RoundManager');

const round = new Scene('round');
let roundManager = null;

round.enter(async (ctx) => {
    roundManager = new RoundManager(ctx);
    await roundManager.startTurn(ctx);
});

round.command('play', (ctx) => roundManager.playCard(ctx));
round.command('strikes', (ctx) => roundManager.listRoundScore(ctx));
round.command('scores', (ctx) => console.log("showing scores"));
round.on('sticker', async (ctx) => await roundManager.playCard(ctx));

module.exports = round;