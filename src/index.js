const Telegraf = require('telegraf');
const session = require('telegraf/session');
const Stage = require('telegraf/stage');
const Extra = Telegraf.Extra;

require('dotenv').config();

const greeter = require('./scenes/greeter');
const lobby = require('./scenes/lobby');

const game = require('./scenes/game');
const bets = require('./scenes/game/bets');
const round = require('./scenes/game/round');

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
    betManager: null,
    roundManager: null,
};

bot.use(session());
bot.use(stage.middleware());
bot.on('sticker', (ctx) => ctx.reply("👌"));
// bot.hears('hi', (ctx) => ctx.reply("Hello!"));

bot.launch();