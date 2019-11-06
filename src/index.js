const Telegraf = require('telegraf');

const session = require('telegraf/session');
const Stage = require('telegraf/stage');

require('dotenv').config();

const greeter = require('./scenes/greeter');
const lobby = require('./scenes/lobby');

const game = require('./scenes/game');
const bets = require('./scenes/game/bets');
const round = require('./scenes/game/round');
const CardStickerManager = require('./scenes/game/cards/CardStickerManager');

// Setting up the stage
const stage = new Stage([greeter, lobby, game, bets, round], { default: 'greeter' });

const bot = new Telegraf(process.env.BOT_TOKEN);
bot.context.lobby = {
    owner: null,
    groupId: null,
    players: [],
};
bot.context.game = {
    gameManager: null,
    stickerManager: new CardStickerManager(),
    betManager: null,
    roundManager: null,
};

bot.use(session());
bot.use(stage.middleware());

bot.on('inline_query', async (ctx) => {
    // if (ctx.game.betManager) {
    //     const betOptions = ctx.game.betManager.getBetInlineQueryOptions();
    //     return ctx.answerInlineQuery(betOptions);
    // }
    if (ctx.game.roundManager) {
        const cardOptions = await ctx.game.roundManager.getPlayerInlineQueryOptions(ctx);

        console.log(cardOptions);
        if (cardOptions.length > 0) {
            await ctx.answerInlineQuery(cardOptions, { cache_time: 0 });
        }
    }

});

bot.launch();