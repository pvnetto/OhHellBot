const Telegraf = require('telegraf');
const express = require('express')

const session = require('telegraf/session');
const Stage = require('telegraf/stage');

const { greeter, lobby, game, draw, bets, round } = require('./game/scenes');
const CardStickerManager = require('./game/cards/card-sticker-manager');

require('dotenv').config();

const port = process.env.PORT || 3000;  // Receives a port from heroku
const expressApp = express()

// Setting up the stage
const stage = new Stage([greeter, lobby, game, draw, bets, round], { default: 'greeter' });

const bot = new Telegraf(process.env.BOT_TOKEN);
bot.telegram.deleteWebhook();
// expressApp.use(bot.webhookCallback(`/${process.env.BOT_SECRET_PATH}`));
// bot.telegram.setWebhook(`${process.env.BOT_URL}:8443/${process.env.BOT_SECRET_PATH}`);

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

bot.on('inline_query', async (ctx) => {
    let queryOptions = [{ type: 'article', id: 0, title: `You're not playing Fodinha`, description: '', thumb_url: '', input_message_content: { message_text: 'Ei bora fodinha' } }];
    const userDb = ctx.db[ctx.from.id];
    if (userDb && userDb.gameManager) {
        queryOptions = await userDb.gameManager.getInlineQueryOptions(ctx);
    }

    return await ctx.answerInlineQuery(queryOptions, { cache_time: 0 });
});

expressApp.listen(port, async () => {
    console.log(`Listening on port ${port}!`);
});

// expressApp.get('/', (req, res) => {
//     res.send('Hello World!');
// });

// expressApp.post('/', (req, res) => {
//     console.log(req.body);
//     console.log("got it");
//     res.status(200).send();
// });


bot.launch();