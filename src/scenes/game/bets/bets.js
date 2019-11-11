const Scene = require('telegraf/scenes/base');
const BetManager = require('./BetManager');

const bets = new Scene('bets');

bets.enter(async ({ db, session, telegram }) => {
    await session.game.gameManager.distributeCards({ session, telegram });

    const betManager = new BetManager({ session });
    session.game.betManager = betManager;

    db[session.lobby.owner.id] = {
        betManager,
    }

    await betManager.beginBetPhase({ session, telegram });
});

bets.command('bet', async (ctx) => await ctx.session.game.betManager.bet(ctx));
bets.command('scores', (ctx) => console.log("showing scores"));

module.exports = bets;