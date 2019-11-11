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
//get username for group command handling
bot.telegram.getMe().then((botInfo) => {
    bot.options.username = botInfo.username;
    console.log("Initialized", botInfo.username);
});

bot.context.db = {};
bot.context.stickerManager = new CardStickerManager();

bot.use(session({
    getSessionKey: (ctx) => {
        if (!ctx.chat) {
            return `${ctx.from.id}:${ctx.from.id}`;
        }
        return `${ctx.chat.id}:${ctx.chat.id}`;
    }
}));

bot.use(stage.middleware());

bot.command('bets', (ctx) => {
    if (ctx.session && ctx.session.game && ctx.session.game.betManager) {
        ctx.session.game.betManager.listBets(ctx);
    }
});

bot.command('check', (ctx) => {
    console.log(`Showing stats for ${ctx.from.first_name}:`);
    console.log(ctx.db);
});

bot.on('inline_query', async (ctx) => {
    let queryOptions = [];
    const userDb = ctx.db[ctx.from.id];
    if (userDb && userDb.gameManager) {
        queryOptions = await userDb.gameManager.getInlineQueryOptions(ctx);
    }

    return await ctx.answerInlineQuery(queryOptions, { cache_time: 0 });
});

bot.launch();