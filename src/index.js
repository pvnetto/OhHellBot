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

bot.command('bets', (ctx) => {
    if (ctx.game.betManager) {
        ctx.game.betManager.listBets(ctx)
    }
});
bot.on('inline_query', async (ctx) => {
    if (ctx.game.gameManager) {
        ctx.game.gameManager.getInlineQueryOptions(ctx);
    }
});

bot.launch();