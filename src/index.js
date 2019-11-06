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
bot.on('sticker', async (ctx) => {
    console.log("Heard stickeur");
    console.log(ctx.message.sticker);
});

bot.hears('bet', (ctx) => console.log("Heard it from bot"));

bot.on('inline_query', async (ctx) => {
    if (ctx.game.betManager) {
        const betOptions = ctx.game.betManager.getBetInlineQueryOptions();
        return ctx.answerInlineQuery(betOptions);
    }
    // if (ctx.game.roundManager) {
    //     const stickerManager = new CardStickerManager();
    //     const playerCards = ctx.game.roundManager.getPlayerCards(ctx);

    //     const cardOptions = [];
    //     const cardPromises = playerCards.map(async (card, idx) => {
    //         const cardSticker = await stickerManager.getCardSticker(card, ctx);
    //         cardOptions.push({
    //             type: 'sticker',
    //             id: idx,
    //             sticker_file_id: cardSticker.file_id,
    //         });
    //     });
    //     await Promise.all(cardPromises);
    //     return ctx.answerInlineQuery(cardOptions);
    // }
});

// bot.use((ctx) => {
//     console.log("Hearing")
//     console.log(ctx);
// });

bot.on('chosen_inline_result', (ctx) => {
    // console.log('chosen inline result', chosenInlineResult)
    console.log('chosen inline result', ctx);
});

// bot.hears('hi', (ctx) => ctx.reply("Hello!"));


// Delegates button actions to game session
bot.action(/bet (.+)/, async (ctx) => {
    if (ctx.game.betManager) {
        ctx.deleteMessage()
            .then(msg => ctx.game.betManager.delegateBet(ctx))
            .catch(err => console.log(err));
    }
});
bot.action(/play (.+)/, async (ctx) => {
    if (ctx.game.roundManager) {
        ctx.game.roundManager.delegatePlay(ctx);
    }
});

bot.launch();