const Scene = require('telegraf/scenes/base');
const BetManager = require('./BetManager');

const bets = new Scene('bets');

bets.enter(async ({ stickerManager, db, session, telegram }) => {
    await session.game.gameManager.distributeCards({ stickerManager, session, telegram });

    const betManager = new BetManager({ db, session });
    session.game.betManager = betManager;

    await betManager.beginBetPhase({ session, telegram });
});

bets.command('bet', async (ctx) => await ctx.session.game.betManager.bet(ctx));
bets.command('scores', (ctx) => console.log("showing scores"));

module.exports = bets;