const Telegraf = require('telegraf');

const session = require('telegraf/session');
const Stage = require('telegraf/stage');

require('dotenv').config();

const greeter = require('./scenes/greeter');
const lobby = require('./scenes/lobby');

const game = require('./scenes/game');
const bets = require('./scenes/game/bets');
const round = require('./scenes/game/round');

// Setting up the stage
const stage = new Stage([greeter, lobby, game, bets, round], { default: 'greeter' });

const bot = new Telegraf(process.env.BOT_TOKEN);
//get username for group command handling
bot.telegram.getMe().then((botInfo) => {
    bot.options.username = botInfo.username;
    console.log("Initialized", botInfo.username);
});

bot.context.db = {};

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
    if (ctx.game.betManager) {
        ctx.game.betManager.listBets(ctx)
    }
});

bot.command('check', (ctx) => {
    console.log(`Showing stats for ${ctx.from.first_name}:`);
    // console.log(ctx.session);
    console.log(ctx.db);
});

bot.on('inline_query', async (ctx) => {
    console.log("querying");
    console.log(ctx.db);

    // if (ctx.game.gameManager) {
    //     ctx.game.gameManager.getInlineQueryOptions(ctx);
    // }
});

bot.launch();